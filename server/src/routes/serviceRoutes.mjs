import express from "express";

import {
    createService,
    getAllServices,
    getActiveServices,
    getServiceById,
    updateService,
    activateService,
    deactivateService,

    createServiceRequest,
    getAllServiceRequests,
    getServiceRequestById,
    updateServiceRequest,
    assignServiceRequest,
    updateServiceRequestStatus,
} from "../controllers/serviceController.mjs";

import authMiddleware from "../middleware/authMiddleware.mjs";
import allowRoles from "../middleware/roleMiddleware.mjs";
import validateMiddleware from "../middleware/validateMiddleware.mjs";

import {
    createServiceValidation,
    updateServiceValidation,
    createServiceRequestValidation,
    updateServiceRequestValidation,
    serviceRequestStatusValidation,
    assignServiceRequestValidation,
    serviceIdValidation,
} from "../validations/serviceValidation.mjs";

const router = express.Router();


// =====================================================
// SERVICES
// =====================================================

router.post(
    "/",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    createServiceValidation,
    validateMiddleware,
    createService
);

router.get(
    "/active",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping",
        "Guest"
    ),
    getActiveServices
);

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
    getAllServices
);

// -----------------------------------------------------
// FIX (frontend integration): the /requests routes MUST be
// registered before "/:id". Otherwise Express matches
// GET /api/services/requests as GET /:id with id="requests"
// and answers "Invalid service ID".
// -----------------------------------------------------
// =====================================================
// SERVICE REQUESTS
// =====================================================

router.post(
    "/requests",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Guest"
    ),
    createServiceRequestValidation,
    validateMiddleware,
    createServiceRequest
);

router.get(
    "/requests",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping",
        "Guest"
    ),
    getAllServiceRequests
);

router.get(
    "/requests/:id",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping",
        "Guest"
    ),
    getServiceRequestById
);

router.put(
    "/requests/:id",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Guest"
    ),
    updateServiceRequestValidation,
    validateMiddleware,
    updateServiceRequest
);

router.patch(
    "/requests/:id/assign",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist"
    ),
    assignServiceRequestValidation,
    validateMiddleware,
    assignServiceRequest
);

router.patch(
    "/requests/:id/status",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping"
    ),
    serviceRequestStatusValidation,
    validateMiddleware,
    updateServiceRequestStatus
);

router.get(
    "/:id",
    authMiddleware,
    allowRoles(
        "Admin",
        "Manager",
        "Receptionist",
        "Housekeeping",
        "Guest"
    ),
    serviceIdValidation,
    validateMiddleware,
    getServiceById
);

router.put(
    "/:id",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    updateServiceValidation,
    validateMiddleware,
    updateService
);

router.patch(
    "/:id/activate",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    serviceIdValidation,
    validateMiddleware,
    activateService
);

router.patch(
    "/:id/deactivate",
    authMiddleware,
    allowRoles("Admin", "Manager"),
    serviceIdValidation,
    validateMiddleware,
    deactivateService
);


export default router;