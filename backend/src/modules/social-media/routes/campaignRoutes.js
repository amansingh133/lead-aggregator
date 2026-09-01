import { Router } from "express";
import {
  listCampaigns,
  listAdSets,
  listAds,
  syncCampaignLeads,
} from "../controllers/campaignController.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  campaignIdParamSchema,
  adsetIdParamSchema,
  syncLeadsBodySchema,
  listCampaignsQuerySchema,
  connectionIdQuerySchema,
} from "../validations/metaConnectionValidation.js";

const router = Router();

router.get("/", validateRequest(listCampaignsQuerySchema, "query"), listCampaigns);

// Browse tree for the Campaigns page: campaign -> ad sets -> ads, live from Meta.
router.get(
  "/adsets/:adsetId/ads",
  validateRequest(adsetIdParamSchema, "params"),
  validateRequest(connectionIdQuerySchema, "query"),
  listAds,
);
router.get(
  "/:campaignId/adsets",
  validateRequest(campaignIdParamSchema, "params"),
  validateRequest(connectionIdQuerySchema, "query"),
  listAdSets,
);

router.post(
  "/:campaignId/sync-leads",
  validateRequest(campaignIdParamSchema, "params"),
  validateRequest(syncLeadsBodySchema),
  syncCampaignLeads,
);

export default router;
