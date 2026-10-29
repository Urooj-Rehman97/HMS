import RoomType from "../models/RoomType.mjs";

// =====================================================
// CREATE ROOM TYPE
// =====================================================

export const createRoomType = async (req, res, next) => {
  try {
    const {
      name,
      description,
      capacity,
      basePrice,
      amenities,
      images,
    } = req.body;

    const existingRoomType = await RoomType.findOne({
      name: name.trim(),
    });

    if (existingRoomType) {
      return res.status(409).json({
        success: false,
        message: "Room type already exists",
      });
    }

    const roomType = await RoomType.create({
      name,
      description,
      capacity,
      basePrice,
      amenities,
      images,
    });

    return res.status(201).json({
      success: true,
      message: "Room type created successfully",
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ALL ROOM TYPES
// =====================================================

export const getAllRoomTypes = async (req, res, next) => {
  try {
    const roomTypes = await RoomType.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: roomTypes.length,
      data: roomTypes,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ACTIVE ROOM TYPES
// =====================================================

export const getActiveRoomTypes = async (req, res, next) => {
  try {
    const roomTypes = await RoomType.find({
      isActive: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: roomTypes.length,
      data: roomTypes,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET SINGLE ROOM TYPE
// =====================================================

export const getRoomTypeById = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE ROOM TYPE
// =====================================================

export const updateRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    if (req.body.name) {
      const duplicate = await RoomType.findOne({
        name: req.body.name.trim(),
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another room type with this name already exists",
        });
      }
    }

    Object.assign(roomType, req.body);

    await roomType.save();

    return res.status(200).json({
      success: true,
      message: "Room type updated successfully",
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DEACTIVATE ROOM TYPE
// =====================================================

export const deactivateRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    roomType.isActive = false;

    await roomType.save();

    return res.status(200).json({
      success: true,
      message: "Room type deactivated successfully",
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ACTIVATE ROOM TYPE
// =====================================================

export const activateRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    roomType.isActive = true;

    await roomType.save();

    return res.status(200).json({
      success: true,
      message: "Room type activated successfully",
      data: roomType,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE ROOM TYPE
// =====================================================

export const deleteRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    const Room = (await import("../models/Room.mjs")).default;

    const roomsUsingType = await Room.countDocuments({
      roomType: roomType._id,
    });

    if (roomsUsingType > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Room type cannot be deleted because rooms are using it. Deactivate it instead.",
      });
    }

    await roomType.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Room type deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};