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
    fs.unlinkSync(localfilepath);
    return res;
} catch (error) {
fs.unlinkSync(localfilepath);//remove the locally saved temporary files from cloudinary
return null;
        
}
}
export const deleteFromCloudinary = async (publicId, resourceType) => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`Deleted from Cloudinary: ${publicId}`);
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
    }
};