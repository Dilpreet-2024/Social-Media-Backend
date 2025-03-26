import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
const router=Router();
import { verifyJWT } from "../middlewares/auth.middlwares.js";
import { publishAVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus} from "../controllers/video.controllers.js";
router.route('/post').post(verifyJWT,upload.fields([
    {
        name:'videoFile',
        maxCount:1
    },
    {
        name:'thumbnail',
        maxCount:1
    }
]),publishAVideo)
router.route('/getme/:id').get(verifyJWT,getVideoById);
router.route('/update/:id').post(verifyJWT,upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),updateVideo);
router.route('/delete/:id').delete(verifyJWT,deleteVideo);
router.route('/toggle/:id').patch(verifyJWT,togglePublishStatus);
export default router;