import {describe, it, expect} from "vitest";

import request from "supertest";
import app from "../src/app";

describe("Health Check API", () => {
    it("Should return HTTP 200", async() => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
    })
});