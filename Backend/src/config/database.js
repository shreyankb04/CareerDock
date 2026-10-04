const mongoose = require('mongoose');

/**
 * Connects to MongoDB and THROWS if it cannot. server.js treats that as fatal
 * (exit code 1) so Render shows a failed deploy instead of a "running" service
 * that can't reach its database.
 */
async function connectToDB() {
    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Mongoose will try to reconnect automatically.')
    })
    // Fail within 10s (default 30s) if Atlas is unreachable (IP not allowed, bad URI).
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
    console.log('Connected to MongoDB');
}

module.exports = connectToDB;
