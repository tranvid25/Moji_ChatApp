import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB= async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_CONNECTION);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDB error",error);
        process.exit(1);
    }
}
export default connectDB;