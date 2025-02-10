import mongoose from "mongoose";
import {db_Name} from '../constants.js'
export const db_Connect = async () =>{
    try
    {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${db_Name}`);
        console.log(`connected to mongodB, connection host:${connectionInstance.connection.host}`);
    }
    catch(err)
    {
        console.log('mongodB connection failed',err);
    }
}