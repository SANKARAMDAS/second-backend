const util = require("util");
const multer = require("multer");
const path = require('path');
const maxSize = 2 * 1024 * 1024;
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(__dirname)
        cb(null, __dirname + "../../public/uploads/");
    },
    filename: function (req, file, cb) {
        let arr = file.originalname.split('.');
        let extension = arr.pop()
        cb(null, req.user._id + '.' + extension)
    },
});
let uploadFile = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Upload .png, .jpg or .jpeg'))
        }

        cb(undefined, true)
    }
}).single("file");
let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;