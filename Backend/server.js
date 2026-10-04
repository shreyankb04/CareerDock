require("dotenv").config(); // Load .env locally (no-op on Render, which injects env vars)

const { validateEnv } = require('./src/config/env');
validateEnv(); // Exit early with a clear message if required env vars are missing

const mongoose = require('mongoose');
const app = require('./src/app');
const connectToDB = require('./src/config/database');

// Render injects PORT (10000 by default). 3000 is only the local fallback.
const PORT = process.env.PORT || 3000;

async function start() {
    await connectToDB(); // Throws if MongoDB is unreachable -> caught below -> exit(1)

    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });

    // Render's proxy reuses connections for up to 120s; Node's default keep-alive (5s)
    // causes sporadic 502s. headersTimeout must exceed keepAliveTimeout.
    server.keepAliveTimeout = 120 * 1000;
    server.headersTimeout = 121 * 1000;

    // Render sends SIGTERM on deploy/restart: finish in-flight requests, then exit.
    const shutdown = () => {
        console.log('SIGTERM received, shutting down...');
        server.close(async () => {
            await mongoose.connection.close().catch(() => {});
            process.exit(0);
        });
        setTimeout(() => process.exit(0), 10000).unref();
    };
    process.on('SIGTERM', shutdown);
}

start().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});
