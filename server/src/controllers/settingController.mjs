import Setting from "../models/Setting.mjs";

// =====================================================
// GET SETTINGS
// =====================================================

export const getSettings = async (
  req,
  res,
  next
) => {
  try {
    let settings = await Setting.findOne()
      .populate(
        "createdBy",
        "firstName lastName email role"
      )
      .populate(
        "updatedBy",
        "firstName lastName email role"
      );

    // Create default settings if none exist
    if (!settings) {
      settings = await Setting.create({
        hotelName: "LuxuryStay",
        createdBy: req.user?._id || null,
      });

      settings = await Setting.findById(
        settings._id
      )
        .populate(
          "createdBy",
          "firstName lastName email role"
        )
        .populate(
          "updatedBy",
          "firstName lastName email role"
        );
    }

    return res.status(200).json({
      success: true,
      message: "Settings retrieved successfully.",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// CREATE SETTINGS
// =====================================================

export const createSettings = async (
  req,
  res,
  next
) => {
  try {
    const existingSettings =
      await Setting.findOne();

    if (existingSettings) {
      return res.status(409).json({
        success: false,
        message:
          "Settings already exist. Use update settings instead.",
      });
    }

    const settings = await Setting.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedSettings =
      await Setting.findById(settings._id)
        .populate(
          "createdBy",
          "firstName lastName email role"
        )
        .populate(
          "updatedBy",
          "firstName lastName email role"
        );

    return res.status(201).json({
      success: true,
      message: "Settings created successfully.",
      data: populatedSettings,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE SETTINGS
// =====================================================

export const updateSettings = async (
  req,
  res,
  next
) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        hotelName: "LuxuryStay",
        ...req.body,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });
    } else {
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        }
      });

      settings.updatedBy = req.user._id;

      await settings.save();
    }

    const populatedSettings =
      await Setting.findById(settings._id)
        .populate(
          "createdBy",
          "firstName lastName email role"
        )
        .populate(
          "updatedBy",
          "firstName lastName email role"
        );

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      data: populatedSettings,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE TAX SETTINGS
// =====================================================

export const updateTaxSettings = async (
  req,
  res,
  next
) => {
  try {
    const {
      taxEnabled,
      taxPercentage,
      serviceChargeEnabled,
      serviceChargePercentage,
    } = req.body;

    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        hotelName: "LuxuryStay",
        createdBy: req.user._id,
      });
    }

    if (taxEnabled !== undefined) {
      settings.taxEnabled = taxEnabled;
    }

    if (taxPercentage !== undefined) {
      settings.taxPercentage = taxPercentage;
    }

    if (
      serviceChargeEnabled !== undefined
    ) {
      settings.serviceChargeEnabled =
        serviceChargeEnabled;
    }

    if (
      serviceChargePercentage !== undefined
    ) {
      settings.serviceChargePercentage =
        serviceChargePercentage;
    }

    settings.updatedBy = req.user._id;

    await settings.save();

    return res.status(200).json({
      success: true,
      message:
        "Tax and service charge settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE HOTEL POLICIES
// =====================================================

export const updatePolicies = async (
  req,
  res,
  next
) => {
  try {
    const {
      cancellationPolicy,
      bookingPolicy,
      privacyPolicy,
      termsAndConditions,
    } = req.body;

    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({
        hotelName: "LuxuryStay",
        createdBy: req.user._id,
      });
    }

    if (
      cancellationPolicy !== undefined
    ) {
      settings.cancellationPolicy =
        cancellationPolicy;
    }

    if (bookingPolicy !== undefined) {
      settings.bookingPolicy =
        bookingPolicy;
    }

    if (privacyPolicy !== undefined) {
      settings.privacyPolicy =
        privacyPolicy;
    }

    if (
      termsAndConditions !== undefined
    ) {
      settings.termsAndConditions =
        termsAndConditions;
    }

    settings.updatedBy = req.user._id;

    await settings.save();

    return res.status(200).json({
      success: true,
      message:
        "Hotel policies updated successfully.",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE NOTIFICATION SETTINGS
// =====================================================

export const updateNotificationSettings =
  async (req, res, next) => {
    try {
      const allowedFields = [
        "emailNotificationsEnabled",
        "bookingNotificationsEnabled",
        "paymentNotificationsEnabled",
        "maintenanceNotificationsEnabled",
        "housekeepingNotificationsEnabled",
        "serviceNotificationsEnabled",
        "feedbackNotificationsEnabled",
      ];

      let settings =
        await Setting.findOne();

      if (!settings) {
        settings = await Setting.create({
          hotelName: "LuxuryStay",
          createdBy: req.user._id,
        });
      }

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          settings[field] = req.body[field];
        }
      });

      settings.updatedBy = req.user._id;

      await settings.save();

      return res.status(200).json({
        success: true,
        message:
          "Notification settings updated successfully.",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

// =====================================================
// UPDATE CHECK-IN / CHECK-OUT SETTINGS
// =====================================================

export const updateCheckInOutSettings =
  async (req, res, next) => {
    try {
      const {
        checkInTime,
        checkOutTime,
        earlyCheckInAllowed,
        lateCheckOutAllowed,
      } = req.body;

      let settings =
        await Setting.findOne();

      if (!settings) {
        settings = await Setting.create({
          hotelName: "LuxuryStay",
          createdBy: req.user._id,
        });
      }

      if (checkInTime !== undefined) {
        settings.checkInTime = checkInTime;
      }

      if (checkOutTime !== undefined) {
        settings.checkOutTime = checkOutTime;
      }

      if (
        earlyCheckInAllowed !== undefined
      ) {
        settings.earlyCheckInAllowed =
          earlyCheckInAllowed;
      }

      if (
        lateCheckOutAllowed !== undefined
      ) {
        settings.lateCheckOutAllowed =
          lateCheckOutAllowed;
      }

      settings.updatedBy = req.user._id;

      await settings.save();

      return res.status(200).json({
        success: true,
        message:
          "Check-in and check-out settings updated successfully.",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

// =====================================================
// UPDATE MAINTENANCE MODE
// =====================================================

export const updateMaintenanceMode =
  async (req, res, next) => {
    try {
      const { maintenanceMode } =
        req.body;

      if (
        typeof maintenanceMode !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "maintenanceMode must be true or false.",
        });
      }

      let settings =
        await Setting.findOne();

      if (!settings) {
        settings = await Setting.create({
          hotelName: "LuxuryStay",
          createdBy: req.user._id,
        });
      }

      settings.maintenanceMode =
        maintenanceMode;

      settings.updatedBy = req.user._id;

      await settings.save();

      return res.status(200).json({
        success: true,
        message: maintenanceMode
          ? "Maintenance mode enabled."
          : "Maintenance mode disabled.",
        data: {
          maintenanceMode:
            settings.maintenanceMode,
        },
      });
    } catch (error) {
      next(error);
    }
  };