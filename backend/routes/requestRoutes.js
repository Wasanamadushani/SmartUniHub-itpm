const express = require("express");
const router = express.Router();
const requestController = require("../controllers/canteenRequestController");
const helperOfferController = require("../controllers/helperOfferController");

// Requests API (matches source ITPMASSI)
router.post("/", requestController.createRequest);
router.get("/", requestController.getOpenRequests);
router.get("/my/:userId", requestController.getMyRequests);
router.get("/helper/:userId", requestController.getHelperRequests);
router.get("/:id", requestController.getRequestDetails);
router.put("/:id", requestController.updateRequestByRequester);
router.delete("/:id", requestController.deleteRequest);
router.put("/:id/cancel", requestController.cancelRequest);
router.put("/:id/assign", requestController.assignHelper);
router.put("/:id/status", requestController.updateStatus);
router.put("/:id/accept", requestController.acceptRequestByHelper);
router.put("/:id/track", requestController.updateTracking);
router.post("/helper-offers", helperOfferController.submitOffer);
router.get("/helper-offers/:requestId", helperOfferController.getOffersByRequest);

module.exports = router;
