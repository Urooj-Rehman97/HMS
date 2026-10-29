import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        category: {
            type: String,
            enum: [
                "Rooms",
                "Suites",
                "Restaurant",
                "Pool",
                "Spa",
                "Gym",
                "Lobby",
                "Events",
                "Exterior",
                "Other",
            ],
            default: "Other",
        },

        image: {
            type: String,
            required: true,
            trim: true,
        },

        imageFilename: {
            type: String,
            required: true,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        displayOrder: {
            type: Number,
            default: 0,
            min: 0,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

gallerySchema.index({
    category: 1,
    isActive: 1,
});

gallerySchema.index({
    displayOrder: 1,
});

gallerySchema.index({
    createdAt: -1,
});

const Gallery = mongoose.model(
    "Gallery",
    gallerySchema
);

export default Gallery;