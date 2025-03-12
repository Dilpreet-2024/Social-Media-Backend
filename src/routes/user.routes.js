import {Router} from 'express'
import { registerUser } from '../controllers/user.controllers.js';
import {loginUser} from '../controllers/user.controllers.js'
import { upload } from '../middlewares/multer.middleware.js';
import {logoutUser} from '../controllers/user.controllers.js'
import {verifyJWT} from '../middlewares/auth.middlwares.js'
import {refreshAccessToken,updateUserAvatar,updateCoverImage,getUserChannelProfile} from '../controllers/user.controllers.js'
import {getCurrentuser,updateAccountDetails,changepassword} from '../controllers/user.controllers.js';
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
    router.route('/update').post(verifyJWT,updateAccountDetails);
    router.route('/updateavatar').post(upload.single('avatar'),verifyJWT,updateUserAvatar);
    router.route('/updatecoverimage').post(upload.single('coverImage'),verifyJWT,updateCoverImage);
    router.route('/subscriptions/:userName').post(verifyJWT,getUserChannelProfile);
export default router;