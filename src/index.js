
// require('dotenv').config({path : './env'})
// This module loads environment variables from a .env file into process.env
import dotenv from "dotenv"
import connectDB from "./db/db.js";
import { app } from "./app.js";


dotenv.config({
    path : "./env"          // why env is also supported here and not just .env ?
})



connectDB()
.then(() => {

    app.on("error", (error) => {
        console.log("Err : ", error);
        throw error
    })       // if express app is giving errors

    app.listen(process.env.PORT || 9000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })

})
.catch((err) => {
    console.log("Mongo DB Connection failed. !! ", err);
})







/*

// first approach

import mongoose from "mongoose"
import { DB_NAME } from "./constants";
import express from "express"
const app = express()


// Never to connect database with just one line, i.e use try/catch or async/await for handling it

// IIFE, ; (semi-colon) for cleaning purposes
;( async () => {
    try {

        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error) => {
            console.log("Err : ", error);
            throw error
        })       // if express app is giving errors

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port : ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("Error : ", error)
        throw err
    }
} ) ()

*/