// mongoose: Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js. It provides a straightforward way to model data, enforce schemas, and connect to MongoDB.
import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

// second approach of connecting database, first commented out in index.js file

const connectDB = async () => {

    try {

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n Mongodb connected !! DB HOST : ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDb Connection failed : ", error);
        process.exit(1)     // this current application is working on a process, and this process keyword is the reference of that
    }

}


export default connectDB