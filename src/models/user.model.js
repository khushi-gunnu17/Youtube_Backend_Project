import mongoose from "mongoose";
// JWT is a bearer token, whoever has this token, the data is sent to that 
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema({

    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },

    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },

    fullname : {
        type : String,
        required : true,
        trim : true,
        index : true
    },

    avatar : {
        type : String,      // cloudinary url is getting stored here
        required : true
    },

    coverImage : {
        type : String       // cloudinary url
    },

    watchHistory : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        }
    ],

    password : {
        type : String,
        required : [true, "Password is required"]
    },

    refreshToken : {
        type : String
    }

}, {timestamps : true})




// hook
// need to know the context here in this function of the user, so cannot use the arrow function in the callback here as it does not have 'this' reference.
userSchema.pre( "save", async function(next) {

    // if the password is not modified then go to the next middleware.
    if (!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 10)      // number = hash rounds, can also give any number here
    next()

} )





// custom methods can also be made
userSchema.methods.isPasswordCorrect = async function(password) {

    // password = normal string password, this.password = encrypted password
    return await bcrypt.compare(password, this.password)

}




// custom access token method generation
userSchema.methods.generateAccessToken = function() {

    // these method have access to the database data
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )

}



// custom refresh token method generation
userSchema.methods.generateRefreshToken = function() {

    return jwt.sign(
        {
            _id : this._id
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}




export const User = mongoose.model("User", userSchema)