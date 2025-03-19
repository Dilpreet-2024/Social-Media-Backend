import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Video} from '../models/video.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
export const publishAVideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body;
    if(!title||!description)
    {
        throw new ApiError(400,"Required fields are empty");
    }
    const videofilepath=req.files?.videoFile[0]?.path;
    const thumbnailpath=req.files?.thumbnail[0]?.path;
    if(!videofilepath)
    {
        throw new ApiError(400,"Failed to fetch video path")
    }
    if(!thumbnailpath)
    {
        throw new ApiError(400,"Failed to upload thumbnail path")
    }
    const videoFile=await uploadOnCloudinary(videofilepath);
    if(!videoFile)
    {
        throw new ApiError(400,"Failed to upload video");
    }
    const thumbnail=await uploadOnCloudinary(thumbnailpath);
    if(!thumbnail)
    {
        throw new ApiError(400,"Failed to upload thubnail");
    }
    const video=new Video({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:Math.round(videoFile.duration)
    })
await video.save();
return new ApiResponse(201,"Video published successfully",video);
})