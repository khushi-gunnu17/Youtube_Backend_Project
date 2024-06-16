import mongoose from "mongoose"

const subscriptionSchema = new mongoose.Schema({

    subscriber : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }, 

    channel : {
        // channel is also a user
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }

}, {
    timestamps : true
})

export const subs = mongoose.model("Subs", subscriptionSchema)