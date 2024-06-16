import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([     // middleware reference
        {
            name : "avatar",
            maxCount : 1
        }, 
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)

router.route("/login").post(
    loginUser
)


// secured routes
router.route("/logout").post(
    verifyJWT,
    logoutUser
)

// verifyJWT middleware was not necessary here coz we had already verified the token in the controller only
router.route("/refresh-token").post(refreshAccessToken)


export default router