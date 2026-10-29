import Gallery from "../models/Gallery.mjs";
import fs from "fs";
import path from "path";


// =====================================================
// IMAGE URL
// =====================================================

const getImageUrl = (
    req,
    filename
) => {
    return `${req.protocol}://${req.get(
        "host"
    )}/uploads/gallery/${filename}`;
};


// =====================================================
// DELETE LOCAL IMAGE
// =====================================================

const deleteLocalImage = (
    filename
) => {
    if (!filename) {
        return;
    }

    const filePath =
        path.resolve(
            "src/uploads/gallery",
            filename
        );

    if (
        fs.existsSync(filePath)
    ) {
        fs.unlinkSync(filePath);
    }
};


// =====================================================
// CREATE GALLERY
// =====================================================

export const createGallery =
    async (req, res, next) => {
        try {
            const {
                title,
                description,
                category,
                isActive,
                displayOrder,
            } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Gallery image is required",
                });
            }

            const imageUrl =
                getImageUrl(
                    req,
                    req.file.filename
                );

            const gallery =
                await Gallery.create({
                    title,
                    description:
                        description || "",

                    category:
                        category ||
                        "Other",

                    image: imageUrl,

                    imageFilename:
                        req.file.filename,

                    isActive:
                        isActive !== undefined
                            ? isActive ===
                              "true" ||
                              isActive === true
                            : true,

                    displayOrder:
                        displayOrder
                            ? Number(
                                  displayOrder
                              )
                            : 0,

                    createdBy:
                        req.user._id,
                });

            const populatedGallery =
                await Gallery.findById(
                    gallery._id
                ).populate(
                    "createdBy",
                    "firstName lastName email role"
                );

            return res.status(201).json({
                success: true,
                message:
                    "Gallery image created successfully",
                data: populatedGallery,
            });
        } catch (error) {
            if (req.file) {
                deleteLocalImage(
                    req.file.filename
                );
            }

            next(error);
        }
    };


// =====================================================
// GET ALL GALLERY
// =====================================================

export const getAllGallery =
    async (req, res, next) => {
        try {
            const {
                category,
                isActive,
                page = 1,
                limit = 20,
            } = req.query;

            const filter = {};

            if (category) {
                filter.category =
                    category;
            }

            if (
                isActive !== undefined
            ) {
                filter.isActive =
                    isActive === "true";
            }

            const pageNumber =
                Number(page);

            const limitNumber =
                Number(limit);

            const skip =
                (pageNumber - 1) *
                limitNumber;

            const [
                gallery,
                total,
            ] = await Promise.all([
                Gallery.find(filter)
                    .populate(
                        "createdBy",
                        "firstName lastName email role"
                    )
                    .sort({
                        displayOrder: 1,
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(limitNumber),

                Gallery.countDocuments(
                    filter
                ),
            ]);

            return res.status(200).json({
                success: true,
                data: gallery,

                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    total,
                    pages: Math.ceil(
                        total /
                            limitNumber
                    ),
                },
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// GET ACTIVE GALLERY
// =====================================================

export const getActiveGallery =
    async (req, res, next) => {
        try {
            const {
                category,
            } = req.query;

            const filter = {
                isActive: true,
            };

            if (category) {
                filter.category =
                    category;
            }

            const gallery =
                await Gallery.find(filter)
                    .sort({
                        displayOrder: 1,
                        createdAt: -1,
                    });

            return res.status(200).json({
                success: true,
                data: gallery,
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// GET SINGLE GALLERY
// =====================================================

export const getGalleryById =
    async (req, res, next) => {
        try {
            const gallery =
                await Gallery.findById(
                    req.params.id
                ).populate(
                    "createdBy",
                    "firstName lastName email role"
                );

            if (!gallery) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Gallery image not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: gallery,
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// UPDATE GALLERY
// =====================================================

export const updateGallery =
    async (req, res, next) => {
        try {
            const gallery =
                await Gallery.findById(
                    req.params.id
                );

            if (!gallery) {
                if (req.file) {
                    deleteLocalImage(
                        req.file.filename
                    );
                }

                return res.status(404).json({
                    success: false,
                    message:
                        "Gallery image not found",
                });
            }

            const {
                title,
                description,
                category,
                isActive,
                displayOrder,
            } = req.body;

            const oldFilename =
                gallery.imageFilename;

            if (
                title !== undefined
            ) {
                gallery.title =
                    title;
            }

            if (
                description !==
                undefined
            ) {
                gallery.description =
                    description;
            }

            if (
                category !==
                undefined
            ) {
                gallery.category =
                    category;
            }

            if (
                isActive !==
                undefined
            ) {
                gallery.isActive =
                    isActive === "true" ||
                    isActive === true;
            }

            if (
                displayOrder !==
                undefined
            ) {
                gallery.displayOrder =
                    Number(
                        displayOrder
                    );
            }


            // Replace image
            if (req.file) {
                gallery.image =
                    getImageUrl(
                        req,
                        req.file.filename
                    );

                gallery.imageFilename =
                    req.file.filename;
            }

            await gallery.save();

            // Delete old image only
            // after database update succeeds
            if (
                req.file &&
                oldFilename &&
                oldFilename !==
                    req.file.filename
            ) {
                deleteLocalImage(
                    oldFilename
                );
            }

            const updatedGallery =
                await Gallery.findById(
                    gallery._id
                ).populate(
                    "createdBy",
                    "firstName lastName email role"
                );

            return res.status(200).json({
                success: true,
                message:
                    "Gallery image updated successfully",
                data: updatedGallery,
            });
        } catch (error) {
            if (req.file) {
                deleteLocalImage(
                    req.file.filename
                );
            }

            next(error);
        }
    };


// =====================================================
// ACTIVATE GALLERY
// =====================================================

export const activateGallery =
    async (req, res, next) => {
        try {
            const gallery =
                await Gallery.findById(
                    req.params.id
                );

            if (!gallery) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Gallery image not found",
                });
            }

            gallery.isActive = true;

            await gallery.save();

            return res.status(200).json({
                success: true,
                message:
                    "Gallery image activated successfully",
                data: gallery,
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// DEACTIVATE GALLERY
// =====================================================

export const deactivateGallery =
    async (req, res, next) => {
        try {
            const gallery =
                await Gallery.findById(
                    req.params.id
                );

            if (!gallery) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Gallery image not found",
                });
            }

            gallery.isActive = false;

            await gallery.save();

            return res.status(200).json({
                success: true,
                message:
                    "Gallery image deactivated successfully",
                data: gallery,
            });
        } catch (error) {
            next(error);
        }
    };


// =====================================================
// DELETE GALLERY
// =====================================================

export const deleteGallery =
    async (req, res, next) => {
        try {
            const gallery =
                await Gallery.findById(
                    req.params.id
                );

            if (!gallery) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Gallery image not found",
                });
            }

            const filename =
                gallery.imageFilename;

            await gallery.deleteOne();

            deleteLocalImage(
                filename
            );

            return res.status(200).json({
                success: true,
                message:
                    "Gallery image deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };