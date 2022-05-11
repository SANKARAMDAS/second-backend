const multer = require("multer");
const uuid = require("uuid")

// configure multer for your server folder
var storage = multer.diskStorage({
    destination: (req, file, cb) => {

        //ensure that this folder already exists in your project directory
        cb(null, __dirname + "../../public/uploads/");
    },
    filename: function (req, file, cb) {
        let arr = file.originalname.split('.');
        let extension = arr.pop()
        cb(null, req.user._id + uuid.v4() + '.' + extension)
    },
});

//Filter the image type
const imageFileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) { //If the file uploaded is not any of this file type

        // If error in file type, then attacch this error to the request header
        req.fileValidationError = "You can upload only image files";
        return cb(null, false, req.fileValidationError);
    }
    cb(null, true)
};

//Here we configure what our storage and filefilter will be, which is the storage and imageFileFilter we created above
exports.uploadKyb = multer({ storage: storage, fileFilter: imageFileFilter })