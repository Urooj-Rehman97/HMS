// =====================================================
// PUBLIC (NO LOGIN) READ-ONLY ENDPOINTS
// Added for the website's public pages (home, rooms, footer, booking
// widget). Nothing here exposes personal or financial data.
// =====================================================

import RoomType from "../models/RoomType.mjs";
import Setting from "../models/Setting.mjs";
import { getAvailableRooms } from "../services/bookingService.mjs";

const HOTEL_FIELDS =
  "hotelName hotelDescription email phone alternatePhone address city country website " +
  "currency currencySymbol taxEnabled taxPercentage serviceChargeEnabled " +
  "serviceChargePercentage checkInTime checkOutTime cancellationPolicy " +
  "bookingPolicy privacyPolicy termsAndConditions maintenanceMode";

// GET /api/public/room-types  ->  active room types
export const getPublicRoomTypes = async (req, res, next) => {
  try {
    const data = await RoomType.find({ isActive: true })
      .select("name description capacity basePrice amenities images")
      .sort({ basePrice: 1 });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/public/hotel  ->  hotel name, contact, currency, tax %, policies
export const getPublicHotel = async (req, res, next) => {
  try {
    const settings = await Setting.findOne().select(HOTEL_FIELDS).lean();
    return res.status(200).json({ success: true, data: settings || null });
  } catch (error) {
    next(error);
  }
};

// GET /api/public/availability?roomType&checkInDate&checkOutDate
// Only returns HOW MANY rooms are free (never room numbers).
export const getPublicAvailability = async (req, res, next) => {
  try {
    const { roomType, checkInDate, checkOutDate } = req.query;
    const rooms = await getAvailableRooms({
      roomTypeId: roomType,
      checkInDate,
      checkOutDate,
    });
    return res.status(200).json({
      success: true,
      available: rooms.length > 0,
      count: rooms.length,
    });
  } catch (error) {
    // bookingService throws plain Errors for bad dates / unknown type
    return res.status(400).json({ success: false, message: error.message });
  }
};
