import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";



const registerUser = asyncHandler( async (req, res) => {

    // 1. get user details from frontend
    const { fullname, email, username, password } = req.body

    // console.log(req.body);




    // 2. validation - fields should not be empty

    // approach number 1 commented out
    // if (fullname === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    if (
        [fullname, email, username, password].some( (field) => field?.trim() === "" )
    ) {
        throw new ApiError(400, "All fields are compulsory.")
    }

    // can have more validations on email field, password, etc.  




    // 3. check if user already exists : from username, email
    const exixitingUser = await User.findOne({
        $or : [{ username }, { email }]
    })


    if (exixitingUser) {
        throw new ApiError(409, "User with email or username already exists.")
    }



    // 4. check for images and especially for avatar

    // multer gives us files access and a middleware does nothing but adds more fields to req.
    const avatarLocalPath = req.files?.avatar[0]?.path      // It is now right now in our own local server and not on the aws or cloudinary.

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && (req.files.coverImage.length > 0)) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is necessary.")
    }




    // 5. upload them to cloudinary, and check the successful upload of avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is necessary.")
    }




    // 6. create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })



    // 7. remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    // 8. check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user.")
    }


    // 9. return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully.")
    )
    
} )







// descriptive names are favourable
const generateAccessAndRefreshTokens = async (userId) => {

    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // add refresh token in the database
        user.refreshToken = refreshToken

        // while saving, mongoose models gets kick in, such as password field which is required but we have not given it here, so we close the validations hence.
        await user.save({ validateBeforeSave : false })

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }

} 







const loginUser = asyncHandler( async (req, res) => {

    // 1. get user details from frontend
    const {email, username, password} = req.body


    // 2. username or email based access
    if (!username && !email) {
        throw new ApiError(400, "both username and email is required.")
    }


    // 3. find the user if it exists
    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist.")
    }



    // 4. password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials.")
    }




    // 5. access and refresh token generation for the user
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // the user right now has empty refreshTokens so, we make the database call once again or update the object 
    // making the database call again
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )




    // 6. send the tokens in the form of cookies

    // by default, cookies can be modified by anyone in the frontend, thus by serving these options the server is only able to modify them then.
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {   
                // if the user wants to save the accessToken and refreshToken in the local storage, depends upon the context.
                user : loggedInUser, accessToken, refreshToken        
            },
            "User logged in successfully."
        )
    )

} )







const logoutUser = asyncHandler( async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {   
            // Ensures the returned document is the updated version.
            new : true      // In return respone, we will get a new updated value
        }
    )


    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out."))

})







// to check refreshToken so as to authorize the user on the basis of it when its access token ends.
const refreshAccessToken = asyncHandler( async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request.")
    }


    try {

        // verify the token
        const decodedTokenInfo = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        // database query always needs to be awaited.
        const user = await User.findById(decodedTokenInfo?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
    
        // matching the tokens which the user has sent and the decoded token from which we have find the user.
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
    
        // we could also have made them global as they are getting reused.
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { accessToken, refreshToken : newRefreshToken },
                "Access Token refreshed successfully"
            )
        )
    } 
    catch (error) {
        throw new ApiError( 401, error?.message  ||  "Invalid refresh token" )
    }

} )








const changeCurrentPassword = asyncHandler( async(req, res) => {

    const {oldPassword, newPassword, confirmPassword} = req.body

    // confirm password checking
    if (!(newPassword === confirmPassword)) {
        throw new ApiError(400, "Invalid confirmed password")
    }



    const user = await User.findById(req.user?._id)

    // the function gives a boolean response
    const isPasswordRight = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordRight) {
        throw new ApiError(400, "Invalid old password.")
    }



    // set the new password here now
    user.password = newPassword

    // we do not want to run other validations here.
    await user.save({ validateBeforeSave : false })   // while saving the hash hook gets called.



    return res.status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully.")
    )

} )








const getCurrentUser = asyncHandler( async (req, res) => {

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            req.user, 
            "current user fetched successfully"
        )
    )

} )








// text based updation
const updateAccountDetails = asyncHandler( async(req, res) => {

    const {fullname, email} = req.body

    if ( !fullname || !email ) {
        throw new ApiError(400, "All fields are required.")
    }

    const user = await User.findByIdAndUpdate(

        req.user?._id, 
        {
            $set : {
                fullname,   // ES6 new syntax
                email : email   // same as above 
            }
        }, 
        {new : true}

    ).select("-password")


    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user, 
            "Account Details Updated successfully."
        )
    )

} )









// if files are getting updated, make them written in another controller file - good practice
const updateUserAvatar = asyncHandler( async (req, res) => {

    // req.file from multer middleware, file here and not files coz we do not need an array of files
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing.")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on cloudinary.")
    }


    // updating the avatar now
    const user = await User.findByIdAndUpdate(

        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        }, 
        {new : true}

    ).select("-password")


    // delete old image - Todo
    // make a utility function for that


    return res.status(200)
    .json(
        new ApiResponse(
            200, 
            user,
            "Avatar Updated Successfully."
        )
    )

} )










const updateUserCoverImage = asyncHandler( async (req, res) => {

    // req.file from multer middleware, file here and not files coz we do not need an array of files
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing.")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cloudinary.")
    }


    // updating the coverImage now
    const user = await User.findByIdAndUpdate(

        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        }, 
        {new : true}

    ).select("-password")


    return res.status(200)
    .json(
        new ApiResponse(
            200, 
            user,
            "Cover Image Updated Successfully."
        )
    )

} )










const getUserChannelProfile = asyncHandler( async (req, res) => {

    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing.")
    }

    // arrays are returned after writing aggregation pipelines
    const channel = User.aggregate([

        {
            $match : {
                username : username?.toLowerCase()
            }
        },

        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },

        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },

        {
            $addFields : {

                subscribersCount : {
                    $size : "$subscribers"
                },

                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },

                isSubscribed : {
                    $cond : {

                        if : {
                            // in can look for results both in the object and array.
                            $in : [req.user?._id, "$subscribers.subscriber"]
                        },

                        then : true,
                        else : false

                    }
                }
            }
        },

        {
            $project : {
                fullname : 1,
                username : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1
            }
        }

    ])


    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exist.")
    }

    // console.log(channel);


    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            channel[0],
            "User channel fetched successfully."
        )
    )


} )










const getWatchHistory = asyncHandler( async (req, res) => {

    const user = await User.aggregate([

        {
            $match : {
                // problem in this case as mongoose doesn't work here, so we cannot use req.user._id, aggregation pipeline code goes directly to mongodb and not via mongoose.
                // _id : req.user._id
                _id : new mongoose.Types.ObjectId(
                    req.user._id
                )
            }
        },

        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",

                // sub-pipelines
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owners",

                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },

                    {
                        // this will return the object and not the array which is implicitly returned.
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user[0].watchHistory,
            "Watch history fetched successfully."
        )
    )

} )











export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}