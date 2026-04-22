const express = require("express");
const router = express.Router();
const rc = require("../controllers/canteenRequestController");
const hoc = require("../controllers/helperOfferController");

// Food requests
router.post("/", rc.createRequest);
router.get("/", rc.getOpenRequests);
router.get("/my/:userId", rc.getMyRequests);
router.get("/helper/:userId", rc.getHelperRequests);
router.get("/:id", rc.getRequestDetails);
router.put("/:id", rc.updateRequestByRequester);
router.delete("/:id", rc.deleteRequest);
router.put("/:id/cancel", rc.cancelRequest);
router.put("/:id/assign", rc.assignHelper);
router.put("/:id/status", rc.updateStatus);
router.put("/:id/accept", rc.acceptRequestByHelper);
router.put("/:id/track", rc.updateTracking);

// Helper offers (nested under requests for convenience)
router.post("/helper-offers", hoc.submitOffer);
router.get("/helper-offers/:requestId", hoc.getOffersByRequest);

module.exports = router;
