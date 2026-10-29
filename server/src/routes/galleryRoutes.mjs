import express from "express";

import {
    createGallery,
    getAllGallery,
    getActiveGallery,
    getGalleryById,
    updateGallery,
    activateGallery,
    deactivateGallery,
    deleteGallery,
} from "../controllers/galleryController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import uploadGallery from "../middleware/uploadMiddleware.mjs";

const router = express.Router();


// =====================================================
// ACTIVE GALLERY
// =====================================================

router.get(
    "/active",
    getActiveGallery
);


// =====================================================
// ALL GALLERY
// =====================================================

router.get(
    "/",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping",
        "Guest"
    ),
    getAllGallery
);


// =====================================================
// CREATE
// =====================================================

router.post(
    "/",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager"
    ),
    uploadGallery.single("image"),
    createGallery
);


// =====================================================
// SINGLE
// =====================================================

router.get(
    "/:id",
    getGalleryById
);


// =====================================================
// UPDATE
// =====================================================

router.put(
    "/:id",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager"
    ),
    uploadGallery.single("image"),
    updateGallery
);


// =====================================================
// ACTIVATE
// =====================================================

router.patch(
    "/:id/activate",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager"
    ),
    activateGallery
);


// =====================================================
// DEACTIVATE
// =====================================================

router.patch(
    "/:id/deactivate",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager"
    ),
    deactivateGallery
);


// =====================================================
// DELETE
// =====================================================

router.delete(
    "/:id",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager"
    ),
    deleteGallery
);

export default router;