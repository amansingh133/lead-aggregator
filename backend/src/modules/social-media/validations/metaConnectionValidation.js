import Joi from "joi";

const objectId = Joi.string().hex().length(24);

// POST /social/meta-connection/oauth/exchange
export const oauthExchangeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(2000).required(),
  state: Joi.string().trim().min(1).max(4000).required(),
});

// POST /social/meta-connection  (finalize)
export const finalizeSchema = Joi.object({
  sessionId: objectId.required().messages({ "*": "Invalid session id" }),
  pageIds: Joi.array()
    .items(Joi.string().trim().pattern(/^\d{1,32}$/))
    .min(1)
    .required()
    .messages({ "*": "Select at least one Page" }),
});

export const connectionIdParamSchema = Joi.object({
  id: objectId.required().messages({ "*": "Invalid connection id" }),
});

export const campaignIdParamSchema = Joi.object({
  campaignId: Joi.string()
    .trim()
    .pattern(/^\d{1,32}$/)
    .required()
    .messages({ "string.pattern.base": "Invalid campaign id" }),
});

export const syncLeadsBodySchema = Joi.object({
  connectionId: objectId.required().messages({ "*": "connectionId is required" }),
});

export const adsetIdParamSchema = Joi.object({
  adsetId: Joi.string()
    .trim()
    .pattern(/^\d{1,32}$/)
    .required()
    .messages({ "string.pattern.base": "Invalid ad set id" }),
});

// GET /social/campaigns/:campaignId/adsets  &  /adsets/:adsetId/ads
export const connectionIdQuerySchema = Joi.object({
  connectionId: objectId.required().messages({ "*": "connectionId is required" }),
}).unknown(true);

export const listCampaignsQuerySchema = Joi.object({
  connectionId: objectId.optional().allow("", null),
}).unknown(true);
