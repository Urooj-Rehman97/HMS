import request from "supertest";
import app from "../app.mjs";

describe("Room API", () => {
  describe("GET /api/rooms", () => {
    it("should reject unauthenticated request", async () => {
      const response = await request(app)
        .get("/api/rooms");

      expect([401, 403]).toContain(
        response.statusCode
      );

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/rooms/available", () => {
    it("should reject unauthenticated request", async () => {
      const response = await request(app)
        .get("/api/rooms/available");

      expect([401, 403]).toContain(
        response.statusCode
      );
    });
  });

  describe("POST /api/rooms", () => {
    it("should reject unauthenticated room creation", async () => {
      const response = await request(app)
        .post("/api/rooms")
        .send({
          roomNumber: "101",
        });

      expect([401, 403]).toContain(
        response.statusCode
      );

      expect(response.body.success).toBe(false);
    });
  });
});