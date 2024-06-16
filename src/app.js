import express from "express"
import cors from "cors"         // Cross-Origin Resource Sharing
import cookieParser from "cookie-parser"

const app = express()


// use method for all the middlewares and configurations
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true      //  allowing cookies to be sent along with the requests.
}))


// three major configurations
// body parser npm is not needed now as now express can do this by default
app.use(express.json({limit : "16kb"}))

// for url
app.use(express.urlencoded({extended : true, limit : "16kb"}))      // in extended, we can use objects inside objects, nested objects

// for storing of files and folders in our own server. Any files in this directory will be accessible from the root URL.
app.use(express.static("public"))   // folder name


app.use(cookieParser())











// routes import 

import userRouter from "./routes/user.routes.js"



// routes declaration

// this "/users" is a prefix here and now the URL would be like 'http:localhost:PORT/api/v1/users/register'
app.use("/api/v1/users", userRouter)


export { app }