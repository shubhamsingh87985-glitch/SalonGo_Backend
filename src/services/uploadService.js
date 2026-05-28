const cloudinary = require('../config/cloudinary');

function parseCloudinaryFile(file) {
  if (!file) return undefined;
  return {
    url: file.path,
    publicId: file.filename,
    resourceType: file.resource_type || file.resourceType || 'image'
  };
}

async function deleteCloudinaryAsset(publicId, resourceType = 'image') {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = {
  parseCloudinaryFile,
  deleteCloudinaryAsset
};
