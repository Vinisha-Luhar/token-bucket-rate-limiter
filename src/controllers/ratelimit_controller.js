const tokenBucketService = require("../services/token_bucket_service");
const slidingWindowService = require("../services/slidingwindow_service");
const clientConfigModel = require("../models/ClientConfig");

class RateLimitController {
  async checkRequest(req, res, next) {
    try {
      const clientKey = req.get("x-client-key");

      if (!clientKey) {
        return res.status(400).json({
          success: false,
          message: "x-client-key header is required"
        });
      }

      const config = await clientConfigModel.findOne({clientKey}).lean();

      if(!config){
        return res.status(404).json({
          success: false,
          message: "Client not found or inactive"
        });
      }

      if(!config.isActive){
        return res.status(403).json({
          success: false,
          message: "Client is Inactive"
        });
      }

      let result;

      switch(config.algorithm){

        case "TOKEN_BUCKET":
          result = await tokenBucketService.checkRequest(clientKey);
          break;

        case "SLIDING_WINDOW":
          result = await slidingWindowService.checkRequest(clientKey);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Unsupported Rate Limiting Algorithm"
          });

      }

      res.set("RateLimit-Limit", String(result.limit));

      res.set(
        "RateLimit-Remaining",
        String(result.remaining)
      );

      res.set(
        "RateLimit-Reset",
        String(result.resetAfterSeconds)
      );

      if (!result.allowed) {
        res.set(
          "Retry-After",
          String(result.retryAfterSeconds)
        );

        return res.status(429).json({
          success: false,
          message: "Rate limit exceeded",
          data: result
        });
      }

      return res.status(200).json({
        success: true,
        message: "Request allowed",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RateLimitController();