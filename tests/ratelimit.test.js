import {describe, it, expect} from "vitest";
import request from "supertest";
import app from "../src/app.js";


const createClientConfig = async (overrides = {}) => {
    const clientConfig = require("../src/models/ClientConfig.js");
    return clientConfig.create({
        clientKey: "test-client",
        algorithm: "TOKEN_BUCKET",
        requestsPerSecond: 10,
        burstSize: 5,
        isActive: true,
        ...overrides,
    });
}

describe("Rate Limiter API", () => {

    it("Should allow request when tokens are available", async () => {
        await createClientConfig();
        const response = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","test-client");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.remaining).toBeDefined();

    });

    it("should return HTTP 429 when the rate limit is exceeded", async () => {
        await createClientConfig({
            requestsPerSecond: 0.1,
            burstSize: 2,
        });

        const firstResponse = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","test-client")

        expect(firstResponse.status).toBe(200);

        const secondResponse = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","test-client");

        expect(secondResponse.status).toBe(200);

        const thirdResponse = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","test-client");

        expect(thirdResponse.status).toBe(429);
        expect(thirdResponse.headers["retry-after"]).toBeDefined();

    });

    it("Should return the request when client does not exist",async() => {
        const response = await request(app)
            .post("/api/v1/ratelimit/check")
            .set("x-client-key","unknown-client");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it("Should Reject request for Inactive Clients",async() => {
        const client = await createClientConfig({isActive: false});

         console.log("Created client:", {
            clientKey: client.clientKey,
            isActive: client.isActive,
        });

        const response = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","test-client");

        console.log("Response status:", response.status);
        console.log("Response body:", response.body);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    it("Should allow the request within the sliding window limit", async() => {
        await createClientConfig({
            clientKey: "sliding-test-client",
            algorithm: "SLIDING_WINDOW",
            windowSizeMs: 60000,
            windowLimit: 2
        });

        const firstResponse= await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","sliding-test-client");

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body.data.allowed).toBe(true);

        const secondResponse = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","sliding-test-client");

        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body.data.allowed).toBe(true);
        expect(secondResponse.body.data.remaining).toBe(0);
    });

    it("Should return 429 when the sliding window llimit is exceeded", async() => {
        await createClientConfig({
            clientKey: "sliding-test-client",
            algorithm: "SLIDING_WINDOW",
            windowSizeMs: 60000,
            windowLimit: 2
        });

         const firstResponse= await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","sliding-test-client");

        expect(firstResponse.status).toBe(200);

        const secondResponse = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","sliding-test-client");

        expect(secondResponse.status).toBe(200);

        const thirdResponse = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","sliding-test-client");

        expect(thirdResponse.status).toBe(429);
        expect(thirdResponse.body.success).toBe(false);
        expect(thirdResponse.body.data.allowed).toBe(false);
        expect(thirdResponse.headers["retry-after"]).toBeDefined();
    });

    it("Should return 404 for unknown sliding window client", async() => {
        const response = await request(app)
        .post("/api/v1/ratelimit/check")
        .set("x-client-key","unknown-sliding-client");

        expect(response.status).toBe(404);
    });

});