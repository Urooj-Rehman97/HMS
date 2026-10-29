import { body, param } from "express-validator";

const ratingFields = [
    "overallRating",
    "cleanlinessRating",
    "serviceRating",
    "staffRating",
    "roomRating",
    "valueRating",
];

const ratingValidators = ratingFields.map((field) =>
    body(field)
        .optional()
        .isFloat({ min: 1, max: 5 })
        .withMessage(
            `${field} must be between 1 and 5`
        )
);

export const createFeedbackValidation = [
    body("reservation")
        .isMongoId()
        .withMessage(
            "Valid reservation ID is required"
        ),

    body("overallRating")
        .isFloat({ min: 1, max: 5 })
        .withMessage(
            "Overall rating must be between 1 and 5"
        ),

    ...ratingValidators,

    body("title")
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage(
            "Feedback title is too long"
        ),

    body("comment")
        .optional()
        .trim()
        .isLength({ max: 3000 })
        .withMessage(
            "Feedback comment is too long"
        ),
];


export const updateFeedbackValidation = [
    param("id")
        .isMongoId()
        .withMessage(
            "Valid feedback ID is required"
        ),

    ...ratingValidators,

    body("title")
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage(
            "Feedback title is too long"
        ),

    body("comment")
        .optional()
        .trim()
        .isLength({ max: 3000 })
        .withMessage(
            "Feedback comment is too long"
        ),
];


export const feedbackIdValidation = [
    param("id")
        .isMongoId()
        .withMessage(
            "Valid feedback ID is required"
        ),
];


export const feedbackResponseValidation = [
    param("id")
        .isMongoId()
        .withMessage(
            "Valid feedback ID is required"
        ),

    body("adminResponse")
        .trim()
        .notEmpty()
        .withMessage(
            "Admin response is required"
        )
        .isLength({ max: 2000 })
        .withMessage(
            "Admin response is too long"
        ),
];


export const feedbackStatusValidation = [
    param("id")
        .isMongoId()
        .withMessage(
            "Valid feedback ID is required"
        ),

    body("status")
        .isIn([
            "PUBLISHED",
            "HIDDEN",
            "PENDING",
        ])
        .withMessage(
            "Invalid feedback status"
        ),
];