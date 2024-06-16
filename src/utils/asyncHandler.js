// approach number 2

// This approach uses promises to handle errors and passes them to the next middleware.
// higher order function

const asyncHandler = (requestHandler) => {

    return (req, res, next) => {
        Promise
        .resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
    
}

export {asyncHandler}









// approach number one

/*

// higher order functions = functions which treat a function as a parameter and can also return a function type
// here we are passing one more function further down the road

// wrapper function
const asyncHandler = (fn) =>  async (req, res, next) => {

    try {

        await fn(req, res, next)
        
    } catch (error) {
        res.status(err.code || 500).json({
            success : false,
            message : err.message            
        })
    }

}


*/