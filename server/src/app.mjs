import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import env from "./config/env.mjs";
import { notFound, errorHandler } from "./middleware/errorMiddleware.mjs";
import authRoutes from "./routes/authRoutes.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import roomTypeRoutes from "./routes/roomTypeRoutes.mjs";
import roomRoutes from "./routes/roomRoutes.mjs";
import guestRoutes from "./routes/guestRoutes.mjs";
import reservationRoutes from "./routes/reservationRoutes.mjs";
import billingRoutes from "./routes/billingRoutes.mjs";
import paymentRoutes from "./routes/paymentRoutes.mjs";
import checkInOutRoutes from "./routes/checkInOutRoutes.mjs";
import housekeepingRoutes from "./routes/housekeepingRoutes.mjs";
import maintenanceRoutes from "./routes/maintenanceRoutes.mjs";
import serviceRoutes from "./routes/serviceRoutes.mjs";
import feedbackRoutes from "./routes/feedbackRoutes.mjs";
import notificationRoutes from "./routes/notificationRoutes.mjs";
import galleryRoutes from "./routes/galleryRoutes.mjs";
import reportRoutes from "./routes/reportRoutes.mjs";
import settingRoutes from "./routes/settingRoutes.mjs";
import publicRoutes from "./routes/publicRoutes.mjs";
import myRoutes from "./routes/myRoutes.mjs";
import securityMiddleware from "./middleware/securityMiddleware.mjs";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security
app.use(securityMiddleware);

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LuxuryStay HMS API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/room-types", roomTypeRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/check-in-out", checkInOutRoutes);
app.use("/api/housekeeping", housekeepingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingRoutes);

// Added for the frontend: public read-only data + guest self-service
app.use("/api/public", publicRoutes);
app.use("/api/my", myRoutes);

// 404
app.use(notFound);

// Error Handler
app.use(errorHandler);

export default app;