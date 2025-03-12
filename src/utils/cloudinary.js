import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
export const uploadOnCloudinary=async (localfilepath)=>{
    try {
    if(!localfilepath)
    {
        return null;
    }
    //upload the file on cloudinary
    const res=await cloudinary.uploader.upload(localfilepath,{
        resource_type:"auto"
    })
    //file has been successfully uploaded on cloudinary
    console.log("file has been successfully uploaded on cloudinary",res);
    fs.unlinkSync(localfilepath);
    return res.url;
} catch (error) {
fs.unlinkSync(localfilepath);//remove the locally saved temporary files from cloudinary
return null;
        
}
}