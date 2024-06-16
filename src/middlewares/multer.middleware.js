import multer from "multer";


const storage = multer.diskStorage({

    // file is with multer only.
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },

    filename: function (req, file, cb) {

        // not a good practice to save the file with original name, but it is fine here.
        cb(null, file.originalname)

    }

})

export const upload = multer({ storage, })