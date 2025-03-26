import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Video} from '../models/video.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
export const publishAVideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body;
    if(!title||!description)
    {
        throw new ApiError(400,"Required fields are empty");
    }
    if(!req.user||!req.user._id)
    {
        throw new ApiError(401,"Unauthorized request");
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
        duration:Math.round(videoFile.duration),
        owner:req.user._id
    })
await video.save();
return res.status(201).json(
    new ApiResponse(200,video,"Video uploaded successfully")
)
})
export const getVideoById=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    if(!isValidObjectId(id))
    {
        throw new ApiError(400,"Invalid video id");
    }
    const video=await Video.findById(id);
    if(!video)
    {
        throw new ApiError(404,"Video not found");
    }
    return res.status(200).json(
        new ApiResponse(200,video,"Video fetched successfully") 
    )

})
export const updateVideo=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    const{title,description}=req.body;
    if(!title||!description)
    {
        throw new ApiError(400,"Title and description are required");
    }
    if(!isValidObjectId(id))
    {
        throw new ApiError(400,"Invalid video id");
    }
    if(!req.user||!req.user._id)
    {
        throw new ApiError(400,"Unauthorized request");
    }
    const videofilepath=req.files?.videoFile[0]?.path;
    const thumbnailpath=req.files?.thumbnail[0]?.path;
    if(!videofilepath)
    {
        throw new ApiError(400,"Failed to fetch video file path");
    }
    if(!thumbnailpath)
    {
        throw new ApiError(400,"Failed to fetch thumbnail path");
    }
    const videoFile=await uploadOnCloudinary(videofilepath);
    if(!videoFile)
    {
        throw new ApiError(400,"Failed to upload video file on cloudinary");
    }
    const thumbnail=await uploadOnCloudinary(thumbnailpath);
    if(!thumbnail)
    {
        throw new ApiError(400,"Failed to upload thumbnail on cloudinary");
    }
    const video=await Video.findByIdAndUpdate(id,
        {title,description,videoFile:videoFile.url,thumbnail:thumbnail.url,duration:Math.round(videoFile.duration),owner:req.user._id},{new:true})
        if(!video)
        {
            throw new ApiError(404,"Video not found");
        }
        return res.status(200).json(
            new ApiResponse(200,video,"Video updated successfully")
        )
        
})
export const deleteVideo=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    if(!isValidObjectId(id))
    {
        throw new ApiError(400,"Invalid video id");
    }
    const video=await Video.findById(id);
    if(!video)
    {
        throw new ApiError(404,"Video not found");
    }
    const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

    // Delete video and thumbnail from Cloudinary
    await deleteFromCloudinary(videoPublicId, "video");
    await deleteFromCloudinary(thumbnailPublicId, "image");
    await Video.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200,"Video deleted successfully"))

})
export const togglePublishStatus=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    if(!isValidObjectId(id))
    {
        throw new ApiError(400,"Invalid video id");
    }
    const video=await Video.findById(id);
    if(!video)
    {
        throw new ApiError(404,"Video not found");
    }
    video.isPublished=!video.isPublished;
    await video.save();
    return res.status(200).json(new ApiResponse(200,video,"Publish status toggled sucessfully"));
})