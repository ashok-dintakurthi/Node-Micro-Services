const Config = require('../../configs/configs');
const bcrypt = require('bcrypt');
const { Users } = require('../modules/Users/Schema');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const responseMessages = require('./ResponseMessages.json');
const cron = require('node-cron');
const Email = require('./Email');

class CommonServices {
    async generateAuthToken(id) {
        return new Promise(async (resolve, reject) => {
            try {
                let token = jwt.sign({
                    id: id,
                    algorithm: "HS256",
                    exp: Math.floor(Date.now() / 1000) + parseInt(Config.tokenExpiry)
                }, Config.securityToken);

                return resolve(token);
            } catch (err) {
                console.log("Error in generateAuthToken", err);
                return reject({ message: err, status: 0 });
            }
        });
    }

    // Encrypting the Password while storing it in the Database
    async ecryptPassword(password) {
        return new Promise(async (resolve, reject) => {
            try {
                let encryptedPassword = bcrypt.hashSync(password, 10);
                return resolve(encryptedPassword);
            } catch (error) {
                return reject(error);
            }
        });
    }

    // Verifying the Password during the login Process
    async verifyPassword(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let isVerified = false;
                var base64data = Buffer.from(data.savedPassword, 'binary').toString();
                isVerified = await bcrypt.compareSync(data.password, base64data)
                return resolve(isVerified);
            } catch (error) {
                console.error("error in verifyPassword ::: ", error)
                return reject(error);
            }
        });
    }

    async  checkEmptyWithFields(body, fieldsArray) {
        return new Promise(async (resolve, reject) => {
            try {
                var requiredFields = [];
                fieldsArray.forEach(element => {
                    if (!(element in body) || body[element] === "" || typeof body[element] === "undefined") {
                        requiredFields.push(element);
                    }
                });
                return resolve(requiredFields);
            } catch (error) {
                return reject(error);
            }
        });
    }

    static decodeUserVerificationToken(token) {
        return new Promise(async (resolve, reject) => {
            const user = await Users.findOne({ verificationToken: token });
            if (user && user.verificationTokenCreationTime && parseInt(Config.verificationTokenExpireTime)) {
                let expiryDate = moment(user.verificationTokenCreationTime).add(parseInt(Config.verificationTokenExpireTime), 'minutes');
                let now = moment();
                if (expiryDate < now) {
                    return resolve(false);
                }
            }
            return resolve(true);
        });
    }

    static validateUser(req, res, next) {
        if (!req.headers.authorization) { return res.send({ status: 0, message: responseMessages.SEND_AUTHORIZATION }) }
        let token = req.headers.authorization;
        return new Promise(async (resolve, reject) => {
            try {
                let tokenDetails = Buffer.from(token, 'binary').toString();
                // Initialisation of variables
                var decoded = jwt.verify(tokenDetails, Config.securityToken);
                if (!decoded) { return res.send({ status: 0, message: responseMessages.TOKEN_EXPIRED }); }

                const authenticatedUser = await Users.findOne({ accessToken: tokenDetails, isDeleted: false });

                if (authenticatedUser) { req.authenticatedUser = authenticatedUser; next(); }
                else {
                    return res.send({ status: 0, message: responseMessages.INVALID_TOKEN });
                }
            } catch (error) {
                console.error("error in validateUser ::: ", error)
                return res.send({ status: 0, message: error });
            }
        })
    }

    static decodeUserForgotToken(token) {
        return new Promise(async (resolve, reject) => {
            const user = await Users.findOne({ forgotToken: token });
            if (user && user.forgotTokenCreationTime && parseInt(Config.forgotTokenExpireTime)) {
                let expiryDate = moment(user.forgotTokenCreationTime).add(parseInt(Config.forgotTokenExpireTime), 'minutes');
                let now = moment();
                if (expiryDate < now) {
                    return resolve(false);
                }
            }
            return resolve(true);
        });
    }



    scheduleCronJobs(scheduledData) {
        console.log('scheduleCronJobs');
        let { minutes, hours, dayOfMonth, month, dayOfWeek, username, todoName } = scheduledData;
        let timeSchedule = `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;

        cron.schedule(timeSchedule, async () => {
            try {
                let emailData = {
                    emailId: data.emailId,
                    subject: "Todo Scheduled",
                    content: `Hey ${username},  This is a gentle reminder that the todo item ${todoName} has scheduled`
                };
                const sendingMail = await new Email().sendMail(emailData);
                console.log('sendingMail', sendingMail);
                if (sendingMail && sendingMail.status == 0) {
                    console.log();
                }
                else if (sendingMail && !sendingMail.response) {
                    console.log(`Mail not sent`);
                }
            } catch (error) {
                console.log('error in cron', error);
            }
        });
        return;
    }

}
module.exports = CommonServices;