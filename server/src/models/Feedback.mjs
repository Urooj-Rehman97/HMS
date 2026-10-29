import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
    {
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Guest",
            required: true,
        },

        reservation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reservation",
            required: true,
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null,
        },

        overallRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        cleanlinessRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        serviceRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        staffRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        roomRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        valueRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        title: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        comment: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: "",
        },

        status: {
            type: String,
            enum: [
                "PUBLISHED",
                "HIDDEN",
                "PENDING",
            ],
            default: "PUBLISHED",
        },

        adminResponse: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        respondedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// One feedback per reservation
feedbackSchema.index(
    { reservation: 1 },
    { unique: true }
);

feedbackSchema.index({ guest: 1 });
feedbackSchema.index({ room: 1 });
feedbackSchema.index({ overallRating: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 });

const Feedback = mongoose.model(
    "Feedback",
    feedbackSchema
);

export default Feedback;