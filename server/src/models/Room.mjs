import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },

    floor: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      min: 0,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "OCCUPIED",
        "CLEANING",
        "MAINTENANCE",
        "VACANT",
      ],
      default: "AVAILABLE",
    },

    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ roomType: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ floor: 1 });

export default mongoose.model("Room", roomSchema);