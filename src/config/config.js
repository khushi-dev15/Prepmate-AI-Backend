import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const config = {
    MONGODB_URI : process.env.MONGODB_URI,
    JWT_SECRET : process.env.JWT_SECRET,
    GEMINI_API_KEY : process.env.GEMINI_API_KEY,
    CLOUD_NAME : process.env.CLOUD_NAME,
    CLOUDINARY_API_KEY : process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET : process.env.CLOUDINARY_API_SECRET,
    OpenAI_API_KEY : process.env.OpenAI_API_KEY,
    GOOGLE_CLIENT_ID : process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET : process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL : process.env.GOOGLE_CALLBACK_URL,
    FRONTEND_URL : process.env.FRONTEND_URL
}

export default config;
