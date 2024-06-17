import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const commentSchema = new mongoose.Schema({

    content : {
        type : String,
        required : true
    }, 

    video : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },

    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }

}, { timestamps : true })


// gives you the ability to control how much comment or data has to be shown, from where the data hai to be given
commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)