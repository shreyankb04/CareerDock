const express = require('express');
const mongoose = require('mongoose');//Used by the health check
const app = express();//Create server instance
const cookieParser = require('cookie-parser');//Import cookie parser middleware
const cors = require('cors');//Import cors middleware
const helmet = require('helmet');//Import helmet for secure HTTP headers
const sanitizeBody = require('./middlewares/sanitize.middleware');//Strips NoSQL-injection-style keys from req.body
const errorHandler = require('./middlewares/errorHandler.middleware');//Centralized error handler (mounted last)
const { getAllowedOrigins } = require('./config/env');//FRONTEND_URL -> allowed CORS origins

// Render (and most PaaS hosts) put the app behind a reverse proxy, which sets
// X-Forwarded-For. express-rate-limit reads the caller's IP from that header
// and throws a validation error at request time if "trust proxy" isn't set
// while that header is present. Trusting exactly 1 hop is the standard,
// spoofing-safe setting for a single reverse proxy (Render/Vercel/Heroku-style)
// and is a no-op locally, where there's no proxy in front of the dev server.
app.set("trust proxy", 1);

app.use(helmet());//Sets a sensible set of secure HTTP headers
app.use(cors(
    {
        // Only the configured frontend origin(s) may call the API with cookies. FRONTEND_URL is
        // required in production (validated at startup); in development it falls back to localhost.
        // CORS runs before the body parser so even a "malformed JSON" 400 carries CORS headers.
        origin: getAllowedOrigins(),
        credentials: true
    }
));//Middleware to enable CORS
app.use(express.json());//Middleware to parse JSON request bodies
app.use((req, res, next) => { req.body = req.body ?? {}; next() });//Express 5 leaves req.body undefined without a body; controllers destructure it
app.use(cookieParser());//Middleware to parse cookies
app.use(sanitizeBody);//Strip $/. keys from request bodies before they reach any controller

/**
 * @route GET /api/health
 * @description Probe for Render's health check / uptime monitors. Exposes no secrets,
 * only whether MongoDB is connected.
 */
app.get("/api/health", (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1
    res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? "ok" : "degraded",
        database: dbConnected ? "connected" : "disconnected",
    })
})

// require all the routes here
const authRouter = require('./routes/auth.routes');//Import auth routes
const interviewRouter = require('./routes/interview.routes');//Import interview routes
const chatRouter = require('./routes/chat.routes');//Import AI Mentor chat routes
// using all the routes here
app.use("/api/auth", authRouter);//Mount auth routes at /api/auth
app.use("/api/interview", interviewRouter);//Mount interview routes at /api/interview
app.use("/api/chat", chatRouter);//Mount AI Mentor routes at /api/chat

// Unknown routes get a JSON 404 instead of Express's HTML page.
app.use((req, res) => {
    res.status(404).json({ message: "Route not found." })
})

// Centralized error handler - must be mounted after all routes. Catches next(err)
// calls and, thanks to Express 5's native async error propagation, any rejected
// promise thrown from an async route handler too.
app.use(errorHandler);

module.exports = app;
