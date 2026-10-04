/**
 * @description Recursively strips keys that start with "$" or contain "." from
 * req.body, which is the standard way a NoSQL-injection payload smuggles a Mongo
 * query operator (e.g. { "email": { "$gt": "" } }) through a JSON body.
 *
 * We intentionally only touch req.body (not req.query/req.params): Express 5
 * makes req.query a getter-only property that can't be reassigned, which is
 * what breaks most off-the-shelf "mongo-sanitize" packages on Express 5. Every
 * endpoint in this app that accepts user input does so via a JSON body anyway,
 * so this covers the real attack surface without fighting the framework.
 */
function sanitizeValue(value) {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue)
    }

    if (value && typeof value === "object") {
        const clean = {}
        for (const key of Object.keys(value)) {
            if (key.startsWith("$") || key.includes(".")) continue
            clean[key] = sanitizeValue(value[key])
        }
        return clean
    }

    return value
}

function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue(req.body)
    }
    next()
}

module.exports = sanitizeBody
