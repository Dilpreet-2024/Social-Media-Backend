import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.models.js";

//it will verify whether user logged in or exists
export const verifyJWT=asyncHandler(async(req,_,next)=>{
    try{
   const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    if(!token)
    {
        throw new ApiError(401,"Unauthorized request");
    }
    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    if(!user)
    {
        //ToDo:frontend discussion
        throw new ApiError(401,"Invalid Access Token")
    }
    req.user=user;
    next();
}
catch(err)
{
    throw new ApiError(401,err?.message||"Invalid access token")
}
})