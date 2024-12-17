import mongoose from "mongoose";

export const connectMongoDb= async ()=>{
    console.log("kapcsolat meghívva!")
    try{
        await mongoose.connect(process.env.DATABASE_URL!);
        console.log('Connected to mongoDB, perfect:');
    }catch(e){
        console.log('Error connecting mongoDB:', e);
    }


}