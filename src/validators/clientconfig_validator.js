const { z } = require("zod");

const clientKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);

const tokenBucketFields = {
  algorithm: z.literal("TOKEN_BUCKET"),
  requestsPerSecond: z.number().min(0.001).max(100000),
  burstSize: z.number().int().min(1).max(1000000),
};

const slidingWindowFields = {
  algorithm: z.literal("SLIDING_WINDOW"),
  windowSizeMs: z.number().int().min(1).max(86400000),
  windowLimit: z.number().int().min(1).max(10000),
};

const tokenBucketSchema = z
  .object(tokenBucketFields)
  .strict();

const slidingWindowSchema = z
  .object(slidingWindowFields)
  .strict();

const createClientSchema = z
  .object({
    clientKey: clientKeySchema,
    ...tokenBucketFields,
  })
  .strict()
  .or(
    z
      .object({
        clientKey: clientKeySchema,
        ...slidingWindowFields,
      })
      .strict()
  );

const updateClientLimitsSchema = tokenBucketSchema.or(
  slidingWindowSchema
);

module.exports = {
  createClientSchema,
  updateClientLimitsSchema,
};