// repeatated code
import { Router } from "express";
import {
     changeCurrentPassword,
     getCurrentUser,
     getUserChannelProfile,
     getWatchHistory,
     loginUser,
     logoutUser,
     refershAccessToken,
     registerUser,
     updateAccoutDetails,
     updateAvatar,
     updatecoverImage
} from "../controllers/user.controller.js";


import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(
    // injecting middleware
    upload.fields([
        {
            name:"avatar",
            maxCount:1,
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser)



router.route("/login").post(loginUser)


//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refershAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword) 
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccoutDetails )  // varify jwt means only access to logged user
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updatecoverImage)
router.route("/watch-history").patch(verifyJWT,upload.single("watchHistory"),getWatchHistory )

// when we using params
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

export default router