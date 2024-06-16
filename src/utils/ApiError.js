
class ApiError extends Error {

    constructor (
        statusCode, 
        message = "Something went wrong",       // not a good message as it is not giving any reference to the user
        errors = [],
        stack = ""
    ) {
        // to overwrite the parameters
        super(message)
        this.statusCode = statusCode
        this.data = null    // ? read documentation
        this.message = message
        this.success = false        // Sets a success property to false, indicating that this error represents a failed operation.
        this.errors = errors

        // stack trace = Function Call Sequence
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }

    }

}


export {ApiError}