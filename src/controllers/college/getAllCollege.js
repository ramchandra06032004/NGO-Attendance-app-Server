// ...existing code...
import { College } from "../../models/college.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAllColleges = asyncHandler(async (req, res) => {
  // Populate classes and nested students so front-end receives full objects
  const colleges = await College.find({}).populate({
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

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: colleges.length,
        colleges,
      },
      "Colleges fetched with classes and students"
    )
  );
});
// ...existing code...