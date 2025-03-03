import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import validator from 'validator'
const userSchema=new mongoose.Schema({
    userName:{
        type:String,
        required:[true,"username is a required field"],
        unique:true,
        lowercase:true,
        index:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        validate:[validator.isEmail,"Invalid email format"]
    },
    fullName:{
        type:String,
        required:[true,"fullname is a required field"],
        trim:true,
        index:true
    },
    avatar:{
        type:String,//cloudinary url
        required:[true,"Avatar is a required field"],
        validate:[validator.isURL,"Invalid avatar URL"]
    },
    coverImage:{
        type:String,//cloudinary url
        validate:[validator.isURL,"Invalid Cover Image URL"]
    },
    password:{
        type:String,
        required:[true,"password is required"],
        minlength:[6,"Password must be atleast 6 characters long"]
        /*
password: {
    type: String,
    required: [true, "Password is required"],
    validate: [
        (value) => validator.isStrongPassword(value, {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }),
        "Password must have at least 6 characters, 1 uppercase, 1 number, and 1 special character"
    ]
}
        */
    },
    refreshToken:{
        type:String,
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ]

},{timestamps:true});
userSchema.pre('save',async function(next){
    if(!this.isModified('password'))
    {
        return next();
    }
    this.password=await bcrypt.hash(this.password,10);
    next();
})
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            userName:this.userName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken=function(){
return jwt.sign(
    {
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}
export const User=mongoose.model("User",userSchema);