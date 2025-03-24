import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
const router=Router();
import { verifyJWT } from "../middlewares/auth.middlwares.js";
import { publishAVideo,getVideoById } from "../controllers/video.controllers.js";
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
export default router;