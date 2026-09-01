import { Router } from "express";
import { list, disconnect } from "../controllers/metaConnectionController.js";
import {
  start,
  exchange,
  finalize,
} from "../controllers/metaOAuthController.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { ROLE } from "../../../utils/constants.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  oauthExchangeSchema,
  finalizeSchema,
  connectionIdParamSchema,
} from "../validations/metaConnectionValidation.js";

const router = Router();

// The parent router already gates everything here to Admin / Super Admin.
// Facebook Login flow: start -> (browser goes to Facebook) -> exchange the
// returned code -> finalize the Pages the user picked.
router.get("/oauth/start", start);
router.post("/oauth/exchange", validateRequest(oauthExchangeSchema), exchange);
router.post("/", validateRequest(finalizeSchema), finalize);

router.get("/", list);

// Only a Super Admin can remove a connection.
router.delete(
  "/:id",
  authorize(ROLE.SUPER_ADMIN),
  validateRequest(connectionIdParamSchema, "params"),
  disconnect,
);

export default router;
