import { Ngo } from "../models/ngo.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
    

const getAllNgos = asyncHandler(async(req,res)=>{
    try {
        const ngos = await Ngo.find().select('-password -tokens');
        if(!ngos){
            throw new ApiError("No NGOs found", 404);
        }
        res.status(200).json(new ApiResponse(ngos, "NGOs fetched successfully"));
    } catch (error) {
        throw new ApiError(error.message, error.statusCode || 500);
    }
})

export default getAllNgos;