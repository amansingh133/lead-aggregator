import axios from "axios";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * Thin wrapper around one Meta Graph API GET call. Every Meta call in this
 * module goes through here so the base URL/version and error translation
 * stay in one place.
 *
 * SECURITY: the access token is passed as a query param (as Meta's API
 * requires), which means it appears in `err.config.url` on failure. This
 * function therefore NEVER includes the axios error's url/config/response
 * body or stack in what it throws - only Meta's own error message and code,
 * mapped to a safe application-level status.
 */

// Meta error codes that mean "the token/permissions are the problem" - the
// user needs to reconnect or grant access, so this is a 4xx (operational),
// not a 5xx (which would log a stack and read as a server fault).
const AUTH_ERROR_CODES = new Set([190, 102, 10, 200, 202, 203, 204, 210, 294, 299, 3, 2500]);
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80000, 80001, 80002, 80003, 80004]);

export async function graphGet(
  nodeOrEdgePath,
  { fields, params = {}, accessToken },
  label,
) {
  const url = `https://graph.facebook.com/${env.facebook.graphVersion}/${nodeOrEdgePath}`;
  try {
    const { data } = await axios.get(url, {
      params: {
        ...params,
        ...(fields ? { fields } : {}),
        access_token: accessToken,
      },
    });
    return data;
  } catch (err) {
    const metaError = err.response?.data?.error || {};
    const metaMessage = metaError.message;
    const metaCode = metaError.code;
    const message = metaMessage
      ? `${label}: ${metaMessage}${metaCode ? ` (Meta error code ${metaCode})` : ""}`
      : `${label}. Please check your Meta connection and try again.`;

    if (AUTH_ERROR_CODES.has(metaCode)) {
      throw new ApiError(
        400,
        `${message} Reconnect your Meta account with a valid token that has ads_read and leads_retrieval.`,
        "META_AUTH_ERROR",
      );
    }
    if (RATE_LIMIT_CODES.has(metaCode)) {
      throw new ApiError(
        429,
        `${label}: Meta rate limit reached. Try again in a few minutes.`,
        "META_RATE_LIMITED",
      );
    }
    // Anything else is an upstream failure on Meta's side.
    throw new ApiError(502, message, "META_GRAPH_ERROR");
  }
}
