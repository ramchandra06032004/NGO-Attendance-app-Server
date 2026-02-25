import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";
import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";

export const getStats = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);

        const [
            students,
            colleges,
            ngos,
            events,
            monthlyRaw,
            categoryRaw,
            recentEventsRaw,
        ] = await Promise.all([
            // Counts
            Student.countDocuments(),
            College.countDocuments(),
            Ngo.countDocuments(),
            Event.countDocuments(),

            // Events per month for current year
            Event.aggregate([
                { $match: { eventDate: { $gte: startOfYear } } },
                {
                    $group: {
                        _id: { $month: "$eventDate" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id": 1 } },
            ]),

            // Top categories by aim field
            Event.aggregate([
                { $group: { _id: "$aim", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]),

            // Recent 4 events
            Event.find()
                .sort({ createdAt: -1 })
                .limit(4)
                .select("aim location eventDate colleges createdAt")
                .populate("colleges.collegeId", "name"),
        ]);

        // Build month array (12 months, 0 if no events that month)
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const found = monthlyRaw.find((m) => m._id === i + 1);
            return found ? found.count : 0;
        });

        // Compute total for percentage calculation
        const categoryTotal = categoryRaw.reduce((sum, c) => sum + c.count, 0);
        const topCategories = categoryRaw.map((c) => ({
            name: c._id || "Other",
            count: c.count,
            percentage:
                categoryTotal > 0 ? Math.round((c.count / categoryTotal) * 100) : 0,
        }));

        // Format recent events
        const recentEvents = recentEventsRaw.map((e) => {
            const totalStudents = e.colleges.reduce(
                (sum, col) => sum + (col.students ? col.students.length : 0),
                0
            );
            const timeAgo = getTimeAgo(e.createdAt);
            return {
                title: e.aim,
                location: e.location,
                registeredStudents: totalStudents,
                date: timeAgo,
                eventDate: e.eventDate,
            };
        });

        res.status(200).json({
            success: true,
            data: {
                counts: { students, colleges, ngos, events },
                monthlyData,
                topCategories,
                recentEvents,
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

function getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000); // seconds
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
