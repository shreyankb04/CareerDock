const mongooose = require('mongoose');

const blacklistTokenSchema = new mongooose.Schema({

    token: {
        type: String,
        required: [true, "Token is required to be added in the blacklist"],
    }
    }, {
        timestamps: true
    })

    const blacklistTokenModel = mongooose.model("blacklistTokens", blacklistTokenSchema)

    module.exports = blacklistTokenModel