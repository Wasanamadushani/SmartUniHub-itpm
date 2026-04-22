const express = require("express");
const router = express.Router();
const { getUsers, getHelpers, updateUserProfile } = require("../controllers/canteenUserController");

router.get("/", getUsers);
router.get("/helpers/active", getHelpers);
router.put("/:id", updateUserProfile);

module.exports = router;
