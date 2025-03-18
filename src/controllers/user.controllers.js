import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
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
 export const changepassword=asyncHandler(async(req,res)=>{
    try{
    const {oldpassword,newpassword}=req.body;
    if(!oldpassword||!newpassword)
    {
        throw new ApiError(400,"Required fields are empty");
    }
    const user=await User.findById(req.user?._id);
    const cpass=await user.isPasswordCorrect(oldpassword);
    if(!cpass)
    {
        throw new ApiError(400,"Invalid password");
    }
    user.password=newpassword;
    await user.save({validateBeforeSave:false});
    return res.status(200)
    .json(
        new ApiResponse(200,"Password changed successfully")
    )
}
catch(err)
{
    throw new ApiError(500,err?.message);
}
 })
 export const getCurrentuser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
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
    return res.status(200).
     json(new ApiResponse(200,user,"Cover Image updated successfully"))  
})
export const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {userName}=req.params;
    if(!userName?.trim())
    {
        throw new ApiError(400,"Username is missing");
    }
    const channel=await User.aggregate([
        {
$match:{
    userName:userName?.toLowerCase()
}},
{
$lookup:{
    from:"subscriptions",
    localField:"_id",
    foreignField:"channel",
    as:"subscribers"
}
},
{
    $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
    }
},
{
    $addFields:
    {
        subscribersCount:{
            $size:"$subscribers",
        },
        channelsSubscribedToCount:{
            $size:"$subscribedTo"
        },
        isSubscribed:{
            $cond:
            {
                if:{
                    $in:[req.user?._id,"$subscribers.subscriber"]
                },
                then:true,
                else:false
            }
        }
    }
},
{
    $project:{
        fullName:1,
        userName:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
    }
}
    ])
    if(!channel?.length)
    {
        throw new ApiError("channel does not exist");
    }
    return res.status(200).
    json(new ApiResponse(200,channel[0],"User channel fetched successfully"));
    
})
export const getWatchHistory=asyncHandler(async(req,res)=>{
const user=await User.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    userName:1,
                                    avatar:1
                                }
                            },
                            {
                                $addFields:{
                                    owner:{
                                        $first:"$owner"
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
])
return res.status(200).json(
    new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
    )
)
})