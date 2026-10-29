const tokenBucketService = require("../services/token_bucket_service");

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

      const result = await tokenBucketService.checkRequest(clientKey);

      res.set("X-RateLimit-Limit", String(result.limit));
      res.set("X-RateLimit-Remaining", String(result.remaining));

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