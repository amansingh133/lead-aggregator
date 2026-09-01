import axios from "axios";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/ApiError.js";
import { graphGet } from "./metaGraphClient.js";

const GRAPH = () => `https://graph.facebook.com/${env.facebook.graphVersion}`;

function requireOAuthConfig() {
  if (!env.facebook.appId || !env.facebook.appSecret || !env.facebook.oauthRedirectUri) {
    throw new ApiError(
      500,
      "Facebook sign-in is not configured on the server.",
      "OAUTH_NOT_CONFIGURED",
    );
  }
}

// Sanitised POST/DELETE - mirrors graphGet: never leak the token, URL, or stack.
async function graphWrite(method, nodeOrEdgePath, { params, accessToken }, label) {
  const url = `${GRAPH()}/${nodeOrEdgePath}`;
  try {
    const { data } = await axios.request({
      method,
      url,
      params: { ...(params || {}), access_token: accessToken },
    });
    return data;
  } catch (err) {
    const metaMessage = err.response?.data?.error?.message;
    const metaCode = err.response?.data?.error?.code;
    throw new ApiError(
      502,
      metaMessage
        ? `${label}: ${metaMessage}${metaCode ? ` (Meta error code ${metaCode})` : ""}`
        : `${label}. Please try connecting again.`,
      "META_GRAPH_ERROR",
    );
  }
}

/**
 * The Facebook Login (OAuth) side of connecting a Page: build the login
 * URL, swap the returned code for tokens, list the person's Pages and ad
 * accounts, and subscribe / unsubscribe a Page to our `leadgen` webhook.
 */
export default class MetaOAuthService {
  /** Full Facebook login URL the browser is redirected to. `state` is our signed CSRF token. */
  static buildAuthUrl({ state }) {
    requireOAuthConfig();
    const q = new URLSearchParams({
      client_id: env.facebook.appId,
      redirect_uri: env.facebook.oauthRedirectUri,
      state,
      response_type: "code",
      // Show the account chooser / consent every time so a client can add a
      // different Facebook account rather than silently reusing the last login.
      auth_type: "reauthorize",
    });
    if (env.facebook.loginConfigId) {
      q.set("config_id", env.facebook.loginConfigId);
    } else {
      q.set("scope", env.facebook.oauthScopes);
    }
    return `https://www.facebook.com/${env.facebook.graphVersion}/dialog/oauth?${q.toString()}`;
  }

  /** Swap the `code` from the redirect for a short-lived user access token. */
  static async exchangeCode(code) {
    requireOAuthConfig();
    const data = await graphGet(
      "oauth/access_token",
      {
        params: {
          client_id: env.facebook.appId,
          redirect_uri: env.facebook.oauthRedirectUri,
          client_secret: env.facebook.appSecret,
          code,
        },
      },
      "Facebook sign-in failed",
    );
    if (!data?.access_token) {
      throw new ApiError(502, "Facebook did not return an access token.", "META_GRAPH_ERROR");
    }
    return data.access_token;
  }

  /** Exchange a short-lived user token for a long-lived one (~60 days). */
  static async toLongLivedUserToken(shortToken) {
    const data = await graphGet(
      "oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: env.facebook.appId,
          client_secret: env.facebook.appSecret,
          fb_exchange_token: shortToken,
        },
      },
      "Facebook token exchange failed",
    );
    return {
      token: data.access_token || shortToken,
      expiresIn: Number(data.expires_in) || null,
    };
  }

  /** Inspect a token to read its granted scopes and expiry. */
  static async inspectToken(token) {
    try {
      const data = await graphGet(
        "debug_token",
        {
          params: { input_token: token },
          accessToken: `${env.facebook.appId}|${env.facebook.appSecret}`,
        },
        "Token inspection failed",
      );
      const d = data?.data || {};
      // Long-lived user tokens have `expires_at: 0` (no fixed expiry); the
      // date that actually matters is `data_access_expires_at` - Meta's ~90-day
      // window after which permission-gated reads (campaigns, lead data) stop
      // working until the user reconnects.
      const expUnix = d.expires_at || d.data_access_expires_at || 0;
      return {
        scopes: Array.isArray(d.scopes) ? d.scopes : [],
        expiresAt: expUnix ? new Date(expUnix * 1000) : null,
      };
    } catch {
      // Non-fatal - we can still connect without the scope/expiry metadata.
      return { scopes: [], expiresAt: null };
    }
  }

  /** Pages the person manages, each with its own long-lived Page access token. */
  static async listPages(userToken) {
    const data = await graphGet(
      "me/accounts",
      {
        fields: "id,name,access_token,tasks",
        params: { limit: 100 },
        accessToken: userToken,
      },
      "Reading your Facebook Pages failed",
    );
    return (data?.data ?? []).map((p) => ({
      id: p.id,
      name: p.name || null,
      accessToken: p.access_token,
      tasks: Array.isArray(p.tasks) ? p.tasks : [],
    }));
  }

  /** Ad accounts the person can browse - best effort (empty if ads_read not granted). */
  static async listAdAccounts(userToken) {
    try {
      const data = await graphGet(
        "me/adaccounts",
        {
          fields: "account_id,name,currency,account_status",
          params: { limit: 200 },
          accessToken: userToken,
        },
        "Reading your ad accounts failed",
      );
      return (data?.data ?? []).map((a) => ({
        id: a.account_id ? `act_${a.account_id}` : a.id,
        name: a.name || null,
        currency: a.currency || null,
      }));
    } catch {
      return [];
    }
  }

  /** Turn on real-time `leadgen` delivery for a Page (subscribe it to our app). */
  static async subscribePageToLeadgen(pageId, pageToken) {
    const data = await graphWrite(
      "post",
      `${pageId}/subscribed_apps`,
      { params: { subscribed_fields: "leadgen" }, accessToken: pageToken },
      "Enabling real-time leads failed",
    );
    return Boolean(data?.success);
  }

  /** Best-effort unsubscribe when a Page is disconnected. */
  static async unsubscribePage(pageId, pageToken) {
    try {
      await graphWrite(
        "delete",
        `${pageId}/subscribed_apps`,
        { accessToken: pageToken },
        "Disabling real-time leads failed",
      );
      return true;
    } catch {
      return false;
    }
  }
}
