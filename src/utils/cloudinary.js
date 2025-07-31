// reusable

import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });


        // upload an image

        const uploadonCloudinary = async (localFilePath) => {
            try {
                if(!localFilePath) return null;
               const response = await cloudinary.uploader.upload(localFilePath, {

                })
                //file has been uploaded successfully
               // console.log(`File uploaded successfully to Cloudinary: ${localFilePath}`, response.url);
               fs.unlinkSync(localFilePath); // delete the file after upload
                    return response
            } catch (error) {
                fs.unlinkSync(localFilePath); // delete the file if upload fails
                console.error(`Error uploading file to Cloudinary: ${error.message}`);
                return null;
            }
        }

        export { uploadonCloudinary }