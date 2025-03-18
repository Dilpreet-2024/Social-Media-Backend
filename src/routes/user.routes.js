import {Router} from 'express'
import { registerUser } from '../controllers/user.controllers.js';
import {loginUser} from '../controllers/user.controllers.js'
import { upload } from '../middlewares/multer.middleware.js';
import {logoutUser} from '../controllers/user.controllers.js'
import {verifyJWT} from '../middlewares/auth.middlwares.js'
import {refreshAccessToken,updateUserAvatar,updateCoverImage,getUserChannelProfile} from '../controllers/user.controllers.js'
import {getCurrentuser,updateAccountDetails,changepassword,getWatchHistory} from '../controllers/user.controllers.js';
const router=Router();
router.route('/register').post(
    upload.fields([
        {
name:"avatar",
maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);
    router.route("/login").post(loginUser);
    //secured routes
    router.route("/logout").post(verifyJWT,logoutUser);
    router.route("/refreshtoken").post(refreshAccessToken)
    router.route("/changepassword").post(verifyJWT,changepassword);
    router.route('/getcurrentuser').get(verifyJWT,getCurrentuser);
    router.route('/update').patch(verifyJWT,updateAccountDetails);
    router.route('/updateavatar').patch(verifyJWT,upload.single('avatar'),updateUserAvatar);
    router.route('/updatecoverimage').patch(verifyJWT,upload.single('coverImage'),updateCoverImage);
    router.route('/subscriptions/:userName').get(verifyJWT,getUserChannelProfile);
    router.route('/history').get(verifyJWT,getWatchHistory);
export default router;