// ...existing code...
import { College } from "../../models/college.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import redisClient from "../../redis/redisClient.js";

export const getAllColleges = asyncHandler(async (req, res) => {
  const collegeId = req.params.collegeId || req.query.collegeId;

  if (collegeId) {
    const cacheKey = `college:${collegeId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            totalCount: 1,
            colleges: [parsed],
          },
          "College fetched with classes and students (cached)"
        )
      );
    }
    

    // Cache miss — fetch from DB
    const college = await College.findById(collegeId)
      .select("-password -refreshToken -__v")
      .populate({
        path: "classes",
        select: "-__v",
        populate: {
          path: "students",
          select: "-password -__v",
          populate: {
            path: "attendedEvents.eventId",
            select: "aim description location eventDate",
            populate: {
              path: "createdBy",
              select: "name",
            },
          },
        },
      });

    if (!college) {
      throw new ApiError(404, "College not found");
    }

    // Store in Redis cache
    await redisClient.set(cacheKey, JSON.stringify(college), {
      EX: process.env.COLLEGE_CACHE_TTL,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalCount: 1,
          colleges: [college],
        },
        "College fetched with classes and students"
      )
    );
  }

  // No collegeId — return all colleges without sensitive fields, classes empty
  const colleges = await College.find({}).select(
    "-password -refreshToken -__v -classes"
  );

  const collegesWithEmptyClasses = colleges.map((college) => ({
    ...college.toObject(),
    classes: [],
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: collegesWithEmptyClasses.length,
        colleges: collegesWithEmptyClasses,
      },
      "Colleges fetched successfully"
    )
  );
});
// ...existing code...