import express from 'express';
import cors from "cors"
import cookieParser from 'cookie-parser';



const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials :true
}))


app.use(express.static("public"))
app.use(cookieParser())

app.use(express.json({limit:"16kb"})); // For parsing application/json
app.use(express.urlencoded({ extended: true, limit:"16kb" })); 
//routes import

import  userRouter from "./routes/user.route.js"

//routes declaration
app.use("/api/v1/users",userRouter)

// http://localhost:8000/api/v1/users/register(/login)

export { app };