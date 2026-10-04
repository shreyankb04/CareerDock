const multer = require("multer")

/**
 * Centralized error handler (mounted last). Client-visible messages:
 *  - our own errors with a 4xx/503 statusCode -> their message (we wrote it)
 *  - multer / body-parser errors -> fixed friendly messages
 *  - everything else (DB, provider SDKs, bugs) -> generic message; details only in server logs
 */
function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err)

    let statusCode = 500
    let message = "Something went wrong. Please try again."

    if (err instanceof multer.MulterError) {
        statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400
        message = err.code === "LIMIT_FILE_SIZE"
            ? "Resume file is too large. The maximum size is 3 MB."
            : "Invalid file upload. Please upload a single PDF resume."
    } else if (err.type === "entity.parse.failed") {
        statusCode = 400
        message = "Invalid request body."
    } else if (err.type === "entity.too.large") {
        statusCode = 413
        message = "Request is too large."
    } else if (Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 500) {
        statusCode = err.statusCode
        message = err.message
    } else if (err.statusCode === 503) {
        statusCode = 503
        message = err.message
    }

    if (statusCode >= 500) console.error(err)

    res.status(statusCode).json({
        message,
        // Stack traces only when NODE_ENV is explicitly "development".
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    })
}

module.exports = errorHandler
