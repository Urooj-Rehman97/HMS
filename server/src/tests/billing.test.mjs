import request from "supertest";
import app from "../app.mjs";

describe("Billing API", () => {
  describe("GET /api/billing", () => {
    it("should reject unauthenticated request", async () => {
      const response = await request(app)
        .get("/api/billing");

      expect([401, 403]).toContain(
        response.statusCode
      );
    });
  });

  describe("POST /api/billing", () => {
    it("should reject unauthenticated billing request", async () => {
      const response = await request(app)
        .post("/api/billing")
        .send({});

      expect([401, 403]).toContain(
        response.statusCode
      );
    });
  });
});