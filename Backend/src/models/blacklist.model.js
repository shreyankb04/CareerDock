const mongooose = require('mongoose');

const blacklistTokenSchema = new mongooose.Schema({

    token: {
        type: String,
        required: [true, "Token is required to be added in the blacklist"],
    },

    // When the JWT itself expires. After that the token is rejected by jwt.verify anyway,
    // so MongoDB's TTL monitor deletes the entry (TTL index below).
    expiresAt: {
        type: Date,
        required: [true, "Token expiry is required"],
    }
    }, {
        timestamps: true
    })

    // Every authenticated request looks a token up by value.
    blacklistTokenSchema.index({ token: 1 })

    // TTL cleanup so the blacklist can't grow forever.
    blacklistTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

    const blacklistTokenModel = mongooose.model("blacklistTokens", blacklistTokenSchema)

    module.exports = blacklistTokenModel