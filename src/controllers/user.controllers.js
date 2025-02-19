import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
const generateAccessandRefreshTokens=async(userId)=>{
    try
    {
const user=await User.findById(userId);
const accessToken=user.generateAccessToken();
const refreshToken=user.generateRefreshToken();
user.refreshToken=refreshToken;
await user.save({validateBeforeSave:false});
return {accessToken,refreshToken};
    }
    catch(error)
    {
        throw new ApiError(500,"Something went wrong while generating access & refresh tokens")
    }

}
export const registerUser=asyncHandler(async(req,res)=>{
    /* 1. get user details from frontend
       2. validation
       3. check if user already exists
       4. check for images, avatar 
       5. check for images, check for avatar
       6. upload them to cloudinary, avatar
       7. create user object -create entry in db
       8. remove password and refresh token field from response
       9. check for user creation
       10.return response.
       */
    const {userName,email,fullName,password}=req.body;
    if(userName===""||email===""||fullName===""||password==="")
    {
        throw new ApiError(400,"Required fields are empty")
    }
    const existedUser=await User.findOne({$or:[{userName},{email}]})
    if(existedUser)
    {
        throw new ApiError(409,"Username or email already exists");
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files?.coverImage[0]?.path;
    }
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar is required");
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar)
    {
        throw new ApiError(400,"Avatar is empty");
    }
    const user=await User.create({
        userName:userName.toLowerCase(),
        email:email.toLowerCase(),
        fullName,
        avatar,
        coverImage:coverImage||"",
        password
    });
    const createdUser=await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user");
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})
export const loginUser=asyncHandler(async(req,res)=>{
    /*
    1. get user credentials from request body
    2. check if user has entered username or email
    3. find the user
    4. password check
    5. access & refresh token
    6. send cookie
    */
   const {userName,email,password}=req.body;
   if(!userName&&!email)
   {
    throw new ApiError(400,"Required fields are empty");
   }
   const user=await User.findOne({$or:[{userName},{email}]})
   if(!user)
   {
    throw new ApiError(403,"User not found");
   }
   const correctPassword=await user.isPasswordCorrect(password);
   if(!correctPassword)
   {
    throw new ApiError(401,"Invalid Password");
   }
   const {accessToken,refreshToken}=await generateAccessandRefreshTokens(user._id);
   const loggedinUser=await User.findById(user._id).select("-password -refreshToken");
   const options={
    httpOnly:true,
    secure:true
   }
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(200,
        {
            user:loggedinUser,accessToken,refreshToken
        },
        "User logged in successfully"
    )
   )
})
export const logoutUser=asyncHandler(async(req,res)=>{
await User.findByIdAndUpdate(
    req.user._id,
    {
$set:{
    refreshToken:undefined
}
    },
{
    new:true
}
)
const options={
    httpOnly:true,
    secure:true
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
    new ApiResponse(200,{},"User logged out")
   )
})
export const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken;
    if(!incomingRefreshToken) 
    {
        throw new ApiError(401,"Unauthorized request");
    }
    try{
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user=await User.findById(decodedToken?._id);
    if(!user)
    {
        throw new ApiError(401,"Invalid Refresh Token");
    }
    if(incomingRefreshToken!=user?.refreshToken)
    {
        throw new ApiError(401,"Refresh Token is expired or used");
    }
    const options={
        httpOnly:true,
        secure:true
       }
   const {accessToken,newrefreshToken}= await generateAccessandRefreshTokens(user._id);
    return res.
    status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",newrefreshToken,options)
    .json(
        new ApiResponse(200,
            {accessToken,refreshToken:newrefreshToken},
            "Access Token and Refresh Token refreshed successfully"
        )
    )
}
catch(err)
{
    throw new ApiError(401,err?.message||"Invalid Refresh Token");
}
 })
 export const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user=await User.findById(req.user?._id);
    const correctPassword=await user.isPasswordCorrect(oldPassword);
    if(!correctPassword)
    {
        throw new ApiError(400,"Invalid old Password");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});
    return res.status(200).
    json(new ApiResponse(200,{},"Password changed successfully"))

 })
 export const getCurrentuser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(
        200,req.user,"current user fetched successfully"
    )
 })
 export const updateAccountDetails=asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body;
    if(!fullName||!email)
    {
        throw new ApiError(400,"Required fields are empty")
    }
   const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,email
            }
        },
        {
            new:true,
        }
    ).select("-password");
    return res.status(200).
    json(new ApiResponse(200,user,"Account details updated successfully"))
 })
export const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalpath=req.file?.path;
     if(!avatarLocalpath)
     {
        throw new ApiError(400,"Avatar file is missing");
     }
     const avatar=await uploadOnCloudinary(avatarLocalpath);
     if(!avatar)
     {
        throw new ApiError(400,"Error while uploading avatar")
     }
     const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar
            }
        },
        {
            new:true
        }
     );
     return res.status(200).
     json(new ApiResponse(200,user,"Avatar updated successfully"))
})
export const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverLocalpath=req.file?.path;
    if(!coverLocalpath)
    {
        throw new ApiError(400,"CoverImage file is missing");
    }
    const coverImage=await uploadOnCloudinary(coverLocalpath);
    if(!coverImage)
    {
        throw new ApiError(400,"Error while uploading cover Image");
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage
            }
        },
        {
            new:true
        }
    )   
})