import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },

        category: {
            type: String,
            enum: [
                "ROOM_SERVICE",
                "WAKE_UP_CALL",
                "TRANSPORTATION",
                "LAUNDRY",
                "SPA",
                "FOOD",
                "BEVERAGE",
                "OTHER",
            ],
            default: "OTHER",
        },

        price: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        unit: {
            type: String,
            trim: true,
            default: "PER_REQUEST",
        },

        image: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        availableForGuests: {
            type: Boolean,
            default: true,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ availableForGuests: 1 });

const Service = mongoose.model("Service", serviceSchema);

export default Service;