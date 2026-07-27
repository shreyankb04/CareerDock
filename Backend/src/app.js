const express = require('express');
const app = express();//Create server instance
const cookieParser = require('cookie-parser');//Import cookie parser middleware
const cors = require('cors');//Import cors middleware

app.use(express.json());//Middleware to parse JSON request bodies
app.use(cookieParser());//Middleware to parse cookies
app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true
    }
));//Middleware to enable CORS

// require all the routes here
const authRouter = require('./routes/auth.routes');//Import auth routes
const interviewRouter = require('./routes/interview.routes');//Import interview routes
// using all the routes here
app.use("/api/auth", authRouter);//Mount auth routes at /api/auth
app.use("/api/interview", interviewRouter);//Mount interview routes at /api/interview

module.exports = app;