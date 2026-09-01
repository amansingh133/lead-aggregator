import MetaConnection from "../models/MetaConnection.js";
import MetaOAuthService from "./MetaOAuthService.js";
import { encrypt, decrypt } from "../../../utils/crypto.js";
import { ApiError } from "../../../utils/ApiError.js";

const WITH_TOKENS = "+pageAccessTokenEncrypted +userAccessTokenEncrypted";

// Non-secret view of a connection, safe to return to the frontend.
function toDto(conn) {
  return {
    id: conn._id,
    pageId: conn.pageId,
    pageName: conn.pageName,
    adAccounts: (conn.adAccounts || []).map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
    })),
    grantedScopes: conn.grantedScopes || [],
    webhookSubscribed: Boolean(conn.webhookSubscribed),
    userTokenExpiresAt: conn.userTokenExpiresAt,
    lastValidatedAt: conn.lastValidatedAt,
  };
}

/**
 * Owns the lifecycle of the organisation's connected Facebook Pages (one
 * row per Page). Created by the Facebook Login flow (see MetaOAuthService);
 * stores both tokens encrypted at rest and hands the decrypted tokens back
 * ONLY to server-side Meta calls.
 */
export default class MetaConnectionService {
  /**
   * Create or refresh the connection for one Page (keyed on pageId). Both
   * tokens are encrypted before storage. `actingUserId` is recorded as
   * `connectedBy` and becomes `createdBy` on leads ingested through it.
   */
  static async upsertPageConnection({
    pageId,
    pageName,
    pageAccessToken,
    userAccessToken,
    userTokenExpiresAt,
    adAccounts,
    grantedScopes,
    webhookSubscribed,
    connectedBy,
  }) {
    const conn = await MetaConnection.findOneAndUpdate(
      { pageId: String(pageId) },
      {
        pageId: String(pageId),
        pageName: pageName || null,
        pageAccessTokenEncrypted: encrypt(pageAccessToken),
        userAccessTokenEncrypted: userAccessToken ? encrypt(userAccessToken) : null,
        userTokenExpiresAt: userTokenExpiresAt || null,
        adAccounts: adAccounts || [],
        grantedScopes: grantedScopes || [],
        webhookSubscribed: Boolean(webhookSubscribed),
        connectedBy: connectedBy || null,
        lastValidatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return toDto(conn);
  }

  /** All connections, non-secret DTOs, for the Meta Connections page. */
  static async listConnections() {
    const rows = await MetaConnection.find().sort({ createdAt: 1 });
    return rows.map(toDto);
  }

  /** Internal: one connection doc WITH tokens, by its id. */
  static async getConnectionById(id) {
    return MetaConnection.findById(id).select(WITH_TOKENS);
  }

  /** Internal: WITH tokens; throws 404 if the id is unknown. */
  static async requireConnectionById(id) {
    const conn = await MetaConnectionService.getConnectionById(id);
    if (!conn) {
      throw ApiError.notFound("Meta connection not found.", "META_CONNECTION_NOT_FOUND");
    }
    return conn;
  }

  /** All connection docs WITH tokens - for cross-connection reads (campaign list). */
  static async getAllWithTokens() {
    return MetaConnection.find().select(WITH_TOKENS);
  }

  /** Internal: the connection whose Page a `leadgen` webhook event belongs to. */
  static async findConnectionForPage(pageId) {
    if (!pageId) return null;
    return MetaConnection.findOne({ pageId: String(pageId) }).select(WITH_TOKENS);
  }

  /** Decrypt the Page token (webhook lead retrieval, subscribed_apps). */
  static resolvePageToken(connectionDoc) {
    if (!connectionDoc?.pageAccessTokenEncrypted) {
      throw ApiError.badRequest(
        "This Facebook Page is not connected. Reconnect it.",
        "META_NOT_CONNECTED",
      );
    }
    return decrypt(connectionDoc.pageAccessTokenEncrypted);
  }

  /** Decrypt the user token (ads_read: campaign list + ad discovery), or null. */
  static resolveUserToken(connectionDoc) {
    return connectionDoc?.userAccessTokenEncrypted
      ? decrypt(connectionDoc.userAccessTokenEncrypted)
      : null;
  }

  static async disconnect(id) {
    const conn = await MetaConnectionService.getConnectionById(id);
    if (!conn) {
      throw ApiError.notFound("Meta connection not found.", "META_CONNECTION_NOT_FOUND");
    }
    // Best-effort: turn off real-time delivery on Meta's side before removing.
    try {
      await MetaOAuthService.unsubscribePage(
        conn.pageId,
        decrypt(conn.pageAccessTokenEncrypted),
      );
    } catch {
      /* ignore - the row is removed regardless */
    }
    await MetaConnection.deleteOne({ _id: id });
  }
}
