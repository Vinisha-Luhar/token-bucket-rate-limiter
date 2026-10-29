const ClientConfig = require("../models/ClientConfig");
const BucketState = require("../models/BucketState");

class TokenBucketService {
  async checkRequest(clientKey) {
    // 1. Fetch the client's rate-limit configuration.
    const config = await ClientConfig.findOne({
      clientKey,
      isActive: true
    }).lean();

    if (!config) {
      const error = new Error("Client not found or inactive");
      error.statusCode = 404;
      throw error;
    }

    if (config.algorithm !== "TOKEN_BUCKET") {
      const error = new Error(
        "Client is not configured to use the Token Bucket algorithm"
      );
      error.statusCode = 400;
      throw error;
    }

    const { requestsPerSecond, burstSize } = config;

    // 2. Initialize the bucket if this is the client's first request.
    try {
      await BucketState.updateOne(
        { clientKey },
        {
          $setOnInsert: {
            clientKey,
            tokens: burstSize,
            lastRefillAt: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      // Another request may have initialized the bucket concurrently.
      if (error.code !== 11000) {
        throw error;
      }
    }

    // 3. Calculate available tokens using MongoDB's server time.
    const availableTokens = {
      $min: [
        burstSize,
        {
          $add: [
            "$tokens",
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $max: [
                        0,
                        {
                          $subtract: ["$$NOW", "$lastRefillAt"]
                        }
                      ]
                    },
                    1000
                  ]
                },
                requestsPerSecond
              ]
            }
          ]
        }
      ]
    };

    // 4. Atomically allow the request and consume one token.
    const updatedState = await BucketState.findOneAndUpdate(
      {
        clientKey,
        $expr: {
          $gte: [availableTokens, 1]
        }
      },
      [
        {
          $set: {
            tokens: {
              $subtract: [availableTokens, 1]
            },
            lastRefillAt: "$$NOW"
          }
        }
      ],
      {
        returnDocument: "after",
        updatePipeline: true
      }
    ).lean();

    console.log("Updated bucket state:", updatedState);
    // 5. If no document was updated, there wasn't a full token available.
    if (!updatedState) {
      console.log("No token consumed. Checking existing bucket state.");
      const state = await BucketState.findOne({ clientKey }).lean();

      if (!state) {
        const error = new Error("Bucket state not found");
        error.statusCode = 500;
        throw error;
      }

      const elapsedSeconds = Math.max(
        0,
        (Date.now() - state.lastRefillAt.getTime()) / 1000
      );

      const currentTokens = Math.min(
        burstSize,
        state.tokens + elapsedSeconds * requestsPerSecond
      );

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((1 - currentTokens) / requestsPerSecond)
      );

      return {
        allowed: false,
        clientKey,
        limit: burstSize,
        remaining: 0,
        retryAfterSeconds
      };
    }

    console.log("Tokens remaining in MongoDB:", updatedState.tokens);
    // 6. Return the decision and remaining tokens.
    return {
      allowed: true,
      clientKey,
      limit: burstSize,
      remaining: Math.floor(updatedState.tokens),
      retryAfterSeconds: 0
    };
  }
}

module.exports = new TokenBucketService();