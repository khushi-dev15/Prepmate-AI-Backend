import dotenv from 'dotenv';

dotenv.config();

const config = {
    MONGODB_URI : process.env.MONGODB_URI,
    JWT_SECRET : process.env.JWT_SECRET,
    GEMINI_API_KEY : process.env.GEMINI_API_KEY,
    CLOUD_NAME : process.env.CLOUD_NAME,
    CLOUDINARY_API_KEY : process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET : process.env.CLOUDINARY_API_SECRET,
    OpenAI_API_KEY : process.env.OpenAI_API_KEY
}

export default config;
