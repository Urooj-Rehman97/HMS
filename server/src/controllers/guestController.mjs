import Guest from "../models/Guest.mjs";

// =====================================================
// CREATE GUEST
// =====================================================

export const createGuest = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      country,
      profileImage,
      preferences,
      notes,
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const existingGuest = await Guest.findOne({
      email: normalizedEmail,
      phone: phone.trim(),
    });

    if (existingGuest) {
      return res.status(409).json({
        success: false,
        message: "A guest with this email and phone already exists",
      });
    }

    const guest = await Guest.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      dateOfBirth: dateOfBirth || null,
      gender: gender || "",
      address,
      city,
      country,
      profileImage,
      preferences,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Guest created successfully",
      data: guest,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ALL GUESTS
// =====================================================

export const getAllGuests = async (req, res, next) => {
  try {
    const {
      search,
      isActive,
      city,
      country,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // -----------------------------------------------
    // ACTIVE / INACTIVE FILTER
    // -----------------------------------------------

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // -----------------------------------------------
    // CITY FILTER
    // -----------------------------------------------

    if (city) {
      filter.city = {
        $regex: city.trim(),
        $options: "i",
      };
    }

    // -----------------------------------------------
    // COUNTRY FILTER
    // -----------------------------------------------

    if (country) {
      filter.country = {
        $regex: country.trim(),
        $options: "i",
      };
    }

    // -----------------------------------------------
    // SEARCH
    // -----------------------------------------------

    if (search) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      filter.$or = [
        {
          firstName: searchRegex,
        },
        {
          lastName: searchRegex,
        },
        {
          email: searchRegex,
        },
        {
          phone: searchRegex,
        },
      ];
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip = (pageNumber - 1) * limitNumber;

    const [guests, totalGuests] = await Promise.all([
      Guest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      Guest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(
      totalGuests / limitNumber
    );

    return res.status(200).json({
      success: true,

      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalGuests,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },

      data: guests,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ACTIVE GUESTS
// =====================================================

export const getActiveGuests = async (req, res, next) => {
  try {
    const guests = await Guest.find({
      isActive: true,
    }).sort({
      firstName: 1,
      lastName: 1,
    });

    return res.status(200).json({
      success: true,
      count: guests.length,
      data: guests,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET SINGLE GUEST
// =====================================================

export const getGuestById = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: guest,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE GUEST
// =====================================================

export const updateGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    // -----------------------------------------------
    // EMAIL NORMALIZATION
    // -----------------------------------------------

    if (req.body.email) {
      req.body.email = req.body.email
        .trim()
        .toLowerCase();
    }

    // -----------------------------------------------
    // CHECK DUPLICATE PROFILE
    // -----------------------------------------------

    if (req.body.email || req.body.phone) {
      const duplicateFilter = {
        _id: {
          $ne: guest._id,
        },
      };

      if (req.body.email) {
        duplicateFilter.email = req.body.email;
      }

      if (req.body.phone) {
        duplicateFilter.phone = req.body.phone.trim();
      }

      const duplicateGuest = await Guest.findOne(
        duplicateFilter
      );

      if (duplicateGuest) {
        return res.status(409).json({
          success: false,
          message:
            "Another guest with the provided email or phone already exists",
        });
      }
    }

    // -----------------------------------------------
    // UPDATE BASIC FIELDS
    // -----------------------------------------------

    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "city",
      "country",
      "profileImage",
      "notes",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        guest[field] = req.body[field];
      }
    });

    // -----------------------------------------------
    // UPDATE PREFERENCES
    // -----------------------------------------------

    if (req.body.preferences) {
      guest.preferences = {
        ...(guest.preferences?.toObject
          ? guest.preferences.toObject()
          : guest.preferences || {}),

        ...req.body.preferences,
      };
    }

    await guest.save();

    return res.status(200).json({
      success: true,
      message: "Guest updated successfully",
      data: guest,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DEACTIVATE GUEST
// =====================================================

export const deactivateGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    guest.isActive = false;

    await guest.save();

    return res.status(200).json({
      success: true,
      message: "Guest deactivated successfully",
      data: guest,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ACTIVATE GUEST
// =====================================================

export const activateGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    guest.isActive = true;

    await guest.save();

    return res.status(200).json({
      success: true,
      message: "Guest activated successfully",
      data: guest,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE GUEST
// =====================================================

export const deleteGuest = async (req, res, next) => {
  try {
    const guest = await Guest.findById(req.params.id);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }

    /*
      Reservation module will later use Guest references.

      Once reservations exist, we should prevent deletion
      of a guest who has reservation history.
    */

    await guest.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Guest deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};