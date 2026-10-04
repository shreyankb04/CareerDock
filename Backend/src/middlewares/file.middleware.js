const multer = require("multer")

const MAX_RESUME_BYTES = 3 * 1024 * 1024 // 3MB

/**
 * Resume upload. Memory storage only (nothing written to disk). PDF only, because
 * that is all the backend can parse. The option is `fileSize` (capital S): the old
 * `filesize` was silently ignored by multer, so no limit was applied.
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 5, fieldSize: 64 * 1024 },
    fileFilter: (req, file, cb) => {
        const isPdf = file.mimetype === "application/pdf" && /\.pdf$/i.test(file.originalname || "")
        if (!isPdf) {
            const err = new Error("Only PDF resumes are supported. Please upload a .pdf file.")
            err.statusCode = 400
            return cb(err)
        }
        cb(null, true)
    },
})

module.exports = upload
