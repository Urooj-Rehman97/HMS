import Service from "../models/Service.mjs";
import ServiceRequest from "../models/ServiceRequest.mjs";
import Reservation from "../models/Reservation.mjs";
import Guest from "../models/Guest.mjs";
import Room from "../models/Room.mjs";
import User from "../models/User.mjs";
import { addCompletedServiceRequestToBill } from "../services/billingService.mjs";
import { notifyRoles, } from "../services/notificationService.mjs";


// =====================================================
// SERVICE CRUD
// =====================================================

export const createService = async (req, res, next) => {
    try {
        const {
            name,
            description,
            category,
            price,
            unit,
            image,
            availableForGuests,
            notes,
        } = req.body;

        const existingService = await Service.findOne({
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i",
            },
        });

        if (existingService) {
            return res.status(400).json({
                success: false,
                message: "Service with this name already exists",
            });
        }

        const service = await Service.create({
            name,
            description,
            category,
            price,
            unit,
            image,
            availableForGuests,
            notes,
        });

        return res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: service,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ALL SERVICES
// =====================================================

export const getAllServices = async (req, res, next) => {
    try {
        const {
            category,
            isActive,
            availableForGuests,
        } = req.query;

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        if (availableForGuests !== undefined) {
            filter.availableForGuests =
                availableForGuests === "true";
        }

        const services = await Service.find(filter)
            .sort({
                category: 1,
                name: 1,
            });

        return res.status(200).json({
            success: true,
            data: services,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ACTIVE SERVICES
// =====================================================

export const getActiveServices = async (
    req,
    res,
    next
) => {
    try {
        const services = await Service.find({
            isActive: true,
            availableForGuests: true,
        }).sort({
            category: 1,
            name: 1,
        });

        return res.status(200).json({
            success: true,
            data: services,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET SERVICE BY ID
// =====================================================

export const getServiceById = async (
    req,
    res,
    next
) => {
    try {
        const service = await Service.findById(
            req.params.id
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: service,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE SERVICE
// =====================================================

export const updateService = async (
    req,
    res,
    next
) => {
    try {
        const service = await Service.findById(
            req.params.id
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        const {
            name,
            description,
            category,
            price,
            unit,
            image,
            availableForGuests,
            notes,
        } = req.body;

        if (name !== undefined) {
            const duplicate = await Service.findOne({
                _id: {
                    $ne: service._id,
                },
                name: {
                    $regex: `^${name.trim()}$`,
                    $options: "i",
                },
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Another service with this name already exists",
                });
            }

            service.name = name;
        }

        if (description !== undefined) {
            service.description = description;
        }

        if (category !== undefined) {
            service.category = category;
        }

        if (price !== undefined) {
            service.price = price;
        }

        if (unit !== undefined) {
            service.unit = unit;
        }

        if (image !== undefined) {
            service.image = image;
        }

        if (availableForGuests !== undefined) {
            service.availableForGuests =
                availableForGuests;
        }

        if (notes !== undefined) {
            service.notes = notes;
        }

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Service updated successfully",
            data: service,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// ACTIVATE SERVICE
// =====================================================

export const activateService = async (
    req,
    res,
    next
) => {
    try {
        const service = await Service.findById(
            req.params.id
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        service.isActive = true;

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Service activated successfully",
            data: service,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// DEACTIVATE SERVICE
// =====================================================

export const deactivateService = async (
    req,
    res,
    next
) => {
    try {
        const service = await Service.findById(
            req.params.id
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        service.isActive = false;

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Service deactivated successfully",
            data: service,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// CREATE SERVICE REQUEST
// =====================================================

export const createServiceRequest = async (
    req,
    res,
    next
) => {
    try {
        const {
            reservation,
            service,
            quantity = 1,
            scheduledFor,
            specialInstructions,
        } = req.body;

        const reservationExists =
            await Reservation.findById(
                reservation
            )
                .populate("guest")
                .populate("room");

        if (!reservationExists) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found",
            });
        }

        if (
            ![
                "PENDING",
                "CONFIRMED",
                "CHECKED_IN",
            ].includes(reservationExists.status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Service can only be requested for an active reservation",
            });
        }

        const serviceExists =
            await Service.findById(service);

        if (!serviceExists) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        if (
            !serviceExists.isActive ||
            !serviceExists.availableForGuests
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This service is currently unavailable",
            });
        }

        /*
         * Guest can only create request for
         * their own reservation.
         */

        if (req.user.role === "Guest") {
            const loggedInGuest =
                await Guest.findOne({
                    email: req.user.email,
                });

            if (
                !loggedInGuest ||
                String(loggedInGuest._id) !==
                String(
                    reservationExists.guest._id
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only request services for your own reservation",
                });
            }
        }

        const totalAmount =
            Number(serviceExists.price) *
            Number(quantity);

        const serviceRequest =
            await ServiceRequest.create({
                reservation:
                    reservationExists._id,

                guest:
                    reservationExists.guest._id,

                room:
                    reservationExists.room?._id ||
                    null,

                service:
                    serviceExists._id,

                quantity,
                unitPrice:
                    serviceExists.price,
                totalAmount,

                requestedDate: new Date(),
                scheduledFor:
                    scheduledFor || null,

                specialInstructions:
                    specialInstructions || "",

                requestedBy:
                    req.user.role === "Guest"
                        ? null
                        : req.user._id,

                status: "PENDING",
            });

        // -------------------------------------------------
        // NOTIFY STAFF ABOUT SERVICE REQUEST
        // -------------------------------------------------

        try {
            await notifyRoles({
                roles: [
                    "Admin",
                    "Manager",
                    "Receptionist",
                ],
                title: "New Service Request",
                message: `A ${serviceExists.name} service has been requested for reservation ${reservationExists._id}.`,
                type: "SERVICE_REQUEST",
                priority: "NORMAL",
                relatedEntity: {
                    entityType: "ServiceRequest",
                    entityId: serviceRequest._id,
                },
                actionUrl: `/service-requests/${serviceRequest._id}`,
            });
        } catch (notificationError) {
            console.error(
                "Service request notification failed:",
                notificationError.message
            );
        }

        const populatedRequest =
            await ServiceRequest.findById(
                serviceRequest._id
            )
                .populate("service")
                .populate(
                    "guest",
                    "firstName lastName email phone"
                )
                .populate(
                    "room",
                    "roomNumber floor"
                )
                .populate(
                    "reservation",
                    "bookingId status"
                );

        return res.status(201).json({
            success: true,
            message:
                "Service request created successfully",
            data: populatedRequest,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET SERVICE REQUESTS
// =====================================================

export const getAllServiceRequests = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            service,
            guest,
            room,
            reservation,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (service) {
            filter.service = service;
        }

        if (guest) {
            filter.guest = guest;
        }

        if (room) {
            filter.room = room;
        }

        if (reservation) {
            filter.reservation = reservation;
        }

        /*
         * Guest can only see own service requests.
         */

        if (req.user.role === "Guest") {
            const loggedInGuest =
                await Guest.findOne({
                    email: req.user.email,
                });

            if (!loggedInGuest) {
                return res.status(403).json({
                    success: false,
                    message: "Guest profile not found",
                });
            }

            filter.guest = loggedInGuest._id;
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const [requests, total] =
            await Promise.all([
                ServiceRequest.find(filter)
                    .populate("service")
                    .populate(
                        "guest",
                        "firstName lastName email phone"
                    )
                    .populate(
                        "room",
                        "roomNumber floor status"
                    )
                    .populate(
                        "reservation",
                        "bookingId checkInDate checkOutDate status"
                    )
                    .populate(
                        "assignedTo",
                        "firstName lastName email role"
                    )
                    .sort({
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(Number(limit)),

                ServiceRequest.countDocuments(
                    filter
                ),
            ]);

        return res.status(200).json({
            success: true,
            data: requests,

            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(
                    total / Number(limit)
                ),
            },
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET SERVICE REQUEST BY ID
// =====================================================

export const getServiceRequestById = async (
    req,
    res,
    next
) => {
    try {
        const request =
            await ServiceRequest.findById(
                req.params.id
            )
                .populate("service")
                .populate("guest")
                .populate("room")
                .populate("reservation")
                .populate(
                    "requestedBy",
                    "firstName lastName email role"
                )
                .populate(
                    "assignedTo",
                    "firstName lastName email role"
                );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Service request not found",
            });
        }

        if (req.user.role === "Guest") {
            const guest =
                await Guest.findOne({
                    email: req.user.email,
                });

            if (
                !guest ||
                String(request.guest._id) !==
                String(guest._id)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to view this service request",
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: request,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// ASSIGN SERVICE REQUEST
// =====================================================

export const assignServiceRequest = async (
    req,
    res,
    next
) => {
    try {
        const { assignedTo } = req.body;

        const request =
            await ServiceRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Service request not found",
            });
        }

        if (
            ["COMPLETED", "CANCELLED", "REJECTED"].includes(
                request.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This service request cannot be assigned",
            });
        }

        const staff =
            await User.findById(assignedTo);

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found",
            });
        }

        if (
            ![
                "Admin",
                "Manager",
                "Receptionist",
                "Housekeeping",
            ].includes(staff.role)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Selected user cannot be assigned this service request",
            });
        }

        request.assignedTo = assignedTo;

        if (request.status === "PENDING") {
            request.status = "CONFIRMED";
        }

        await request.save();

        return res.status(200).json({
            success: true,
            message:
                "Service request assigned successfully",
            data: request,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE SERVICE REQUEST
// =====================================================

export const updateServiceRequest = async (
    req,
    res,
    next
) => {
    try {
        const request =
            await ServiceRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Service request not found",
            });
        }

        if (
            ["COMPLETED", "CANCELLED", "REJECTED"].includes(
                request.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Finalized service request cannot be edited",
            });
        }

        const {
            quantity,
            scheduledFor,
            specialInstructions,
        } = req.body;

        if (quantity !== undefined) {
            request.quantity = quantity;
            request.totalAmount =
                Number(request.unitPrice) *
                Number(quantity);
        }

        if (scheduledFor !== undefined) {
            request.scheduledFor =
                scheduledFor;
        }

        if (specialInstructions !== undefined) {
            request.specialInstructions =
                specialInstructions;
        }

        await request.save();

        return res.status(200).json({
            success: true,
            message:
                "Service request updated successfully",
            data: request,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE STATUS
// =====================================================

export const updateServiceRequestStatus = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            completionNotes,
            cancellationReason,
        } = req.body;

        const request =
            await ServiceRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Service request not found",
            });
        }

        if (
            ["COMPLETED", "CANCELLED", "REJECTED"].includes(
                request.status
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Finalized service request cannot change status",
            });
        }

        if (
            status === "IN_PROGRESS" &&
            !request.assignedTo
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Service request must be assigned before starting",
            });
        }

        if (status === "COMPLETED") {
            // Bill the service exactly once before finalizing the request.
            // The charge is linked to this request in Bill.charges so retries
            // after a partial failure cannot duplicate the invoice line.
            // Always reconcile the invoice, even if the legacy flag is already
            // true. The billing helper is idempotent by serviceRequest id.
            const service = await Service.findById(request.service);
            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "The service linked to this request could not be found.",
                });
            }

            try {
                await addCompletedServiceRequestToBill(request, service);
                request.addedToBill = true;
            } catch (billingError) {
                if (billingError.code === "BILL_FINALIZED") {
                    return res.status(409).json({
                        success: false,
                        message: billingError.message,
                    });
                }
                throw billingError;
            }

            request.completedAt = new Date();

            if (completionNotes !== undefined) {
                request.completionNotes = completionNotes;
            }
        }

        if (status === "CANCELLED") {
            request.cancelledAt = new Date();

            if (cancellationReason !== undefined) {
                request.cancellationReason =
                    cancellationReason;
            }
        }

        request.status = status;

        await request.save();

        return res.status(200).json({
            success: true,
            message:
                "Service request status updated successfully",
            data: request,
        });
    } catch (error) {
        next(error);
    }
};