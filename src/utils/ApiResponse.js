class ApiResponse {

    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }

}



export { ApiResponse }


// By using ApiResponse, developers can ensure that all API responses follow a consistent format. This consistency makes it easier for frontend applications or clients consuming the API to understand and handle responses uniformly.
