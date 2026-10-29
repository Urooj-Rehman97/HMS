import request from "supertest";
import app from "../app.mjs";

describe("Authentication API", () => {
  describe("GET /api/health", () => {
    it("should return API health status", async () => {
      const response = await request(app)
        .get("/api/health");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /api/auth/register", () => {
    it("should reject invalid registration data", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "",
          lastName: "",
          email: "invalid-email",
          password: "123",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject missing login credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject unauthenticated request", async () => {
      const response = await request(app)
        .get("/api/auth/me");

      expect([401, 403]).toContain(
        response.statusCode
      );

      expect(response.body.success).toBe(false);
    });
  });
});