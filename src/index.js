import dotenv from 'dotenv';
dotenv.config({
    path:'./.env'
});
import { db_Connect } from './db/index.js';
import app from './app.js';
db_Connect().
then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(`Server error`,err);
})