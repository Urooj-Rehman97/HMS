import Feedback from "../models/Feedback.mjs";
import Guest from "../models/Guest.mjs";
import Reservation from "../models/Reservation.mjs";


// =====================================================
// CREATE FEEDBACK
// =====================================================

export const createFeedback = async (
    req,
    res,
    next
) => {
    try {
        const {
            reservation,
            overallRating,
            cleanlinessRating,
            serviceRating,
            staffRating,
            roomRating,
            valueRating,
            title,
            comment,
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

        // Feedback only after checkout
        if (
            reservationExists.status !==
            "CHECKED_OUT"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Feedback can only be submitted after check-out",
            });
        }

        const guest =
            await Guest.findOne({
                email: req.user.email,
            });

        if (!guest) {
            return res.status(404).json({
                success: false,
                message:
                    "Guest profile not found",
            });
        }

        // Guest can only review own reservation
        if (
            String(guest._id) !==
            String(reservationExists.guest._id)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only submit feedback for your own reservation",
            });
        }

        // Only one feedback per reservation
        const existingFeedback =
            await Feedback.findOne({
                reservation,
            });

        if (existingFeedback) {
            return res.status(400).json({
                success: false,
                message:
                    "Feedback has already been submitted for this reservation",
            });
        }

        const feedback =
            await Feedback.create({
                guest: guest._id,
                reservation:
                    reservationExists._id,
                room:
                    reservationExists.room?._id ||
                    null,

                overallRating,
                cleanlinessRating,
                serviceRating,
                staffRating,
                roomRating,
                valueRating,

                title: title || "",
                comment: comment || "",

                status: "PUBLISHED",
            });

        const populatedFeedback =
            await Feedback.findById(
                feedback._id
            )
                .populate(
                    "guest",
                    "firstName lastName email"
                )
                .populate(
                    "reservation",
                    "bookingId checkInDate checkOutDate status"
                )
                .populate(
                    "room",
                    "roomNumber floor"
                );

        return res.status(201).json({
            success: true,
            message:
                "Feedback submitted successfully",
            data: populatedFeedback,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET ALL FEEDBACK
// =====================================================

export const getAllFeedback = async (
    req,
    res,
    next
) => {
    try {
        const {
            status,
            rating,
            guest,
            room,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (rating) {
            filter.overallRating =
                Number(rating);
        }

        if (guest) {
            filter.guest = guest;
        }

        if (room) {
            filter.room = room;
        }

        // Guest can only see own feedback
        if (req.user.role === "Guest") {
            const guestProfile =
                await Guest.findOne({
                    email: req.user.email,
                });

            if (!guestProfile) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Guest profile not found",
                });
            }

            filter.guest =
                guestProfile._id;
        }

        const skip =
            (Number(page) - 1) *
            Number(limit);

        const [feedback, total] =
            await Promise.all([
                Feedback.find(filter)
                    .populate(
                        "guest",
                        "firstName lastName email"
                    )
                    .populate(
                        "reservation",
                        "bookingId checkInDate checkOutDate"
                    )
                    .populate(
                        "room",
                        "roomNumber floor"
                    )
                    .populate(
                        "respondedBy",
                        "firstName lastName role"
                    )
                    .sort({
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(Number(limit)),

                Feedback.countDocuments(filter),
            ]);

        return res.status(200).json({
            success: true,
            data: feedback,

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
// GET FEEDBACK BY ID
// =====================================================

export const getFeedbackById = async (
    req,
    res,
    next
) => {
    try {
        const feedback =
            await Feedback.findById(
                req.params.id
            )
                .populate("guest")
                .populate("reservation")
                .populate("room")
                .populate(
                    "respondedBy",
                    "firstName lastName role"
                );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }

        // Guest ownership check
        if (req.user.role === "Guest") {
            const guest =
                await Guest.findOne({
                    email: req.user.email,
                });

            if (
                !guest ||
                String(feedback.guest._id) !==
                    String(guest._id)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to view this feedback",
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// GET MY FEEDBACK
// =====================================================

export const getMyFeedback = async (
    req,
    res,
    next
) => {
    try {
        const guest =
            await Guest.findOne({
                email: req.user.email,
            });

        if (!guest) {
            return res.status(404).json({
                success: false,
                message:
                    "Guest profile not found",
            });
        }

        const feedback =
            await Feedback.find({
                guest: guest._id,
            })
                .populate(
                    "reservation",
                    "bookingId checkInDate checkOutDate status"
                )
                .populate(
                    "room",
                    "roomNumber floor"
                )
                .sort({
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE OWN FEEDBACK
// =====================================================

export const updateFeedback = async (
    req,
    res,
    next
) => {
    try {
        const feedback =
            await Feedback.findById(
                req.params.id
            );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }

        if (req.user.role === "Guest") {
            const guest =
                await Guest.findOne({
                    email: req.user.email,
                });

            if (
                !guest ||
                String(feedback.guest) !==
                    String(guest._id)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only update your own feedback",
                });
            }
        }

        const {
            overallRating,
            cleanlinessRating,
            serviceRating,
            staffRating,
            roomRating,
            valueRating,
            title,
            comment,
        } = req.body;

        if (
            overallRating !== undefined
        ) {
            feedback.overallRating =
                overallRating;
        }

        if (
            cleanlinessRating !== undefined
        ) {
            feedback.cleanlinessRating =
                cleanlinessRating;
        }

        if (
            serviceRating !== undefined
        ) {
            feedback.serviceRating =
                serviceRating;
        }

        if (
            staffRating !== undefined
        ) {
            feedback.staffRating =
                staffRating;
        }

        if (
            roomRating !== undefined
        ) {
            feedback.roomRating =
                roomRating;
        }

        if (
            valueRating !== undefined
        ) {
            feedback.valueRating =
                valueRating;
        }

        if (title !== undefined) {
            feedback.title = title;
        }

        if (comment !== undefined) {
            feedback.comment = comment;
        }

        await feedback.save();

        return res.status(200).json({
            success: true,
            message:
                "Feedback updated successfully",
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// ADMIN / MANAGER RESPONSE
// =====================================================

export const respondToFeedback = async (
    req,
    res,
    next
) => {
    try {
        const {
            adminResponse,
        } = req.body;

        const feedback =
            await Feedback.findById(
                req.params.id
            );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }

        feedback.adminResponse =
            adminResponse;

        feedback.respondedBy =
            req.user._id;

        feedback.respondedAt =
            new Date();

        await feedback.save();

        const updatedFeedback =
            await Feedback.findById(
                feedback._id
            )
                .populate(
                    "guest",
                    "firstName lastName email"
                )
                .populate(
                    "respondedBy",
                    "firstName lastName role"
                );

        return res.status(200).json({
            success: true,
            message:
                "Response added successfully",
            data: updatedFeedback,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// UPDATE FEEDBACK STATUS
// =====================================================

export const updateFeedbackStatus = async (
    req,
    res,
    next
) => {
    try {
        const feedback =
            await Feedback.findById(
                req.params.id
            );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }

        feedback.status =
            req.body.status;

        await feedback.save();

        return res.status(200).json({
            success: true,
            message:
                "Feedback status updated successfully",
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// DELETE FEEDBACK
// =====================================================

export const deleteFeedback = async (
    req,
    res,
    next
) => {
    try {
        const feedback =
            await Feedback.findById(
                req.params.id
            );

        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: "Feedback not found",
            });
        }

        await feedback.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Feedback deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};


// =====================================================
// FEEDBACK SUMMARY
// =====================================================

export const getFeedbackSummary = async (
    req,
    res,
    next
) => {
    try {
        const match = {
            status: "PUBLISHED",
        };

        const summary =
            await Feedback.aggregate([
                {
                    $match: match,
                },
                {
                    $group: {
                        _id: null,

                        totalReviews: {
                            $sum: 1,
                        },

                        averageRating: {
                            $avg:
                                "$overallRating",
                        },

                        averageCleanliness: {
                            $avg:
                                "$cleanlinessRating",
                        },

                        averageService: {
                            $avg:
                                "$serviceRating",
                        },

                        averageStaff: {
                            $avg:
                                "$staffRating",
                        },

                        averageRoom: {
                            $avg:
                                "$roomRating",
                        },

                        averageValue: {
                            $avg:
                                "$valueRating",
                        },

                        fiveStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$overallRating",
                                            5,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        fourStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$overallRating",
                                            4,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        threeStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$overallRating",
                                            3,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        twoStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$overallRating",
                                            2,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },

                        oneStar: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$overallRating",
                                            1,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);

        const data = summary[0] || {
            totalReviews: 0,
            averageRating: 0,
            averageCleanliness: 0,
            averageService: 0,
            averageStaff: 0,
            averageRoom: 0,
            averageValue: 0,
            fiveStar: 0,
            fourStar: 0,
            threeStar: 0,
            twoStar: 0,
            oneStar: 0,
        };

        // Round averages
        Object.keys(data).forEach(
            (key) => {
                if (
                    typeof data[key] ===
                    "number"
                ) {
                    data[key] =
                        Math.round(
                            data[key] * 100
                        ) / 100;
                }
            }
        );

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};