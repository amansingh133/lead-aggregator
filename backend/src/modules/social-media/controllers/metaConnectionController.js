import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/ApiResponse.js";
import MetaConnectionService from "../services/MetaConnectionService.js";

// GET /social/meta-connection
// Every connected Facebook Page, non-secret fields only.
export const list = asyncHandler(async (req, res) => {
  const data = await MetaConnectionService.listConnections();
  return sendSuccess(res, 200, "Meta connections", data);
});

// DELETE /social/meta-connection/:id   (Super Admin only - see the route)
// Best-effort unsubscribes the Page from our webhook, then removes the row.
export const disconnect = asyncHandler(async (req, res) => {
  await MetaConnectionService.disconnect(req.params.id);
  return sendSuccess(res, 200, "Disconnected");
});
