const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model")

async function authUserMiddleware(req, res, next) {

    const token = req.cookies.token

    if(!token){
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    // Verify signature/expiry first so forged cookies never reach the database.
    let decoded
    try{
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch(err){
        return res.status(401).json({
            message: "Invalid token."
        })
    }

    // Tokens issued for other purposes (e.g. password reset) must not work as a session.
    if(decoded.purpose){
        return res.status(401).json({
            message: "Invalid token."
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if(isTokenBlacklisted) {
        return res.status(401).json({
            message: "Token is invalid."
        })
    }

    req.user = decoded; // Attach the decoded user information to the request object
    next(); // Proceed to the next middleware or route handler
}

module.exports = { authUserMiddleware}
