const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Create storage engine for different upload types
const createStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `placement-mgmt/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
      resource_type: 'auto',
    },
  });
};

const uploadResume = multer({ storage: createStorage('resumes') });
const uploadMarksheet = multer({ storage: createStorage('marksheets') });
const uploadAvatar = multer({ storage: createStorage('avatars') });
const uploadLogo = multer({ storage: createStorage('logos') });

module.exports = { uploadResume, uploadMarksheet, uploadAvatar, uploadLogo };
