import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app=express();
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
));
app.use(cookieParser());
app.use(express.urlencoded({extended:true,limit:"16 kb"}))
app.use(express.json({limit:"16 kb"}));
app.use(express.static('public'))
app.get('/',(req,res)=>{
    res.send('Home Page')
})
import userRoute from './routes/user.routes.js'
app.use('/api',userRoute)
export default app;