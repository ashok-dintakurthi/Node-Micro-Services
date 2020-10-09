var mongoose = require('mongoose');
var schema = mongoose.Schema;
const _ = require("lodash");

let typeString = { type: String }

var userSchema = new schema({
    firstname: typeString,
    lastname: typeString,
    username: typeString,
    emailId: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: { type: Buffer },
    isDeleted: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
    mobile: typeString,
    forgotToken: typeString,
    forgotTokenCreationTime: { type: Date },
    lastSeen: { type: Date },
    accessToken: typeString
}, {
        timestamps: true
    });


let Users = mongoose.model('User', userSchema);
module.exports = { Users }