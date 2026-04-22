const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const helperOfferController = require("../controllers/helperOfferController");

// Food promotions admin
router.get("/admin", offerController.getAllOffers);   // GET /api/offers/admin?canteen=xxx

// Helper offers (must come before /:id to avoid conflict)
router.post("/", (req, res) => {
  // If body has requestId + helperId it's a helper offer, otherwise a food promotion
  if (req.body && req.body.requestId && req.body.helperId) {
    return helperOfferController.submitOffer(req, res);
  }
  return offerController.createOffer(req, res);
});

// Food promotions (active only)
router.get("/", offerController.getOffers);           // GET /api/offers?canteen=xxx

// Helper offers by requestId OR food promotion by id
router.get("/:requestId", helperOfferController.getOffersByRequest);

// Food promotion CRUD
router.put("/:id", offerController.updateOffer);
router.delete("/:id", offerController.deleteOffer);

module.exports = router;
