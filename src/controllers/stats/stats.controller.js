import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";
import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";

export const getStats = async (req, res) => {
    try {
        const [students, colleges, ngos, events] = await Promise.all([
            Student.countDocuments(),
            College.countDocuments(),
            Ngo.countDocuments(),
            Event.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            data: {
                students,
                colleges,
                ngos,
                events,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch stats",
            error: error.message,
        });
    }
};
