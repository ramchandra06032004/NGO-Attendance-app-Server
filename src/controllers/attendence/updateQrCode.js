import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateQR } from "../../utils/generateQR/generateQR.js";
import mongoose from "mongoose";
import { Event } from "../../models/events.js";
export const updateQrCode = asyncHandler(async (req, res) => {
    if (req.user.userType !== "ngo") {
        throw new ApiError(403, "Access denied: Only NGOs can mark attendance");
    }
    const { eventId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }
    const newQrCode = generateQR();
    event.currAttendanceString = newQrCode;
    await event.save();
    res.status(200).json({
        success: true,
        message: "QR code updated successfully",
        data: {
            qrCode: newQrCode,
        },
    });
})