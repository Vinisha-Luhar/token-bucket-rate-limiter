const express = require("express");

const rateLimitController = require("../controllers/ratelimit_controller");

const router = express.Router();

router.post(
  "/check",
  (req, res, next) =>
    rateLimitController.checkRequest(req, res, next)
);

module.exports = router;