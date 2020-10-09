/****************************
 EMAIL HANDLING OPERATIONS
 ****************************/
let nodemailer = require('nodemailer');
const config = require("../../configs/configs");

let smtpTransport = nodemailer.createTransport({
    pool: true,
    host: "",
    port: 440,
    secure: false,
    auth: {
        user: '',
        pass: ''
    },
    debug: true
});


class Email {

    send(mailOption) {
        return new Promise(async (resolve, reject) => {
            smtpTransport.sendMail(mailOption, (error, result) => {
                if (error) {
                    console.error("error in send function ::: ", error);
                    return reject({ sattus: 0, message: error });
                }
                return resolve(result);
            });
        });
    }

    sendMail(mailData) {
        return new Promise(async (resolve, reject) => {
            try {
                let mailOptions = {
                    from: config.defaultEmailId,
                    to: mailData.emailId,
                    subject: mailData.subject,
                    html: mailData.content
                }
                const result = await new Email().send(mailOptions);
                return resolve(result);
            } catch (error) {
                console.error('Error in sendMail ::: ', error);
                return reject(error);
            }
        });
    }
}
module.exports = Email;