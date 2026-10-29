import request from "supertest";
import app from "../app.mjs";

describe("Reservation API", () => {
  describe("GET /api/reservations", () => {
    it("should reject unauthenticated request", async () => {
      const response = await request(app)
        .get("/api/reservations");

      expect([401, 403]).toContain(
        response.statusCode
      );
    });
  });

  describe("POST /api/reservations", () => {
    it("should reject unauthenticated reservation creation", async () => {
      const response = await request(app)
        .post("/api/reservations")
        .send({});

      expect([401, 403]).toContain(
        response.statusCode
      );

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/reservations/availability", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/reservations/availability");

      expect([401, 403]).toContain(
        response.statusCode
      );
    });
  });
});