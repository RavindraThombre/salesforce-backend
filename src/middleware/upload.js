const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const createUploader = (
    folder,
    allowedFormats = ["jpg", "jpeg", "png", "webp"],
    resourceType = "image"
) => {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: async () => ({
            folder: `blueCloudMentor/${folder}`,
            resource_type: resourceType,
            allowed_formats: allowedFormats,
        }),
    });

    return multer({ storage });
};

module.exports = createUploader;

// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../config/cloudinary");

// const createUploader = (folder) => {
//     const storage = new CloudinaryStorage({
//         cloudinary,
//         params: async (req, file) => ({
//             folder: `blueCloudMentor/${folder}`,
//             allowed_formats: ["jpg", "jpeg", "png", "webp"],
//         }),
//     });

//     return multer({ storage });
// };

// module.exports = createUploader;