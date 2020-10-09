const responseMessages = require('../../services/ResponseMessages.json')
const Users = require('./Schema').Users;
const CommonServices = require('../../services/CommonServices');
const Email = require('../../services/Email');
const moment = require('moment');
const _ = require('lodash');
const Config = require('../../../configs/configs');
const ObjectId = require('mongodb').ObjectID;
const { Todos } = require('../Todos/Schema');

class UserController {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }

    /***********************************************************
        @description  To store the details of a User
        @param 
        {
            "emailId":"testuser@grr.la",
            "password":"Test@123",
            "firstname":"Test",
            "lastname":"User",
            "mobile":"9584789654"
        }
        @returns JSON object as the User is registered successfully
    ************************************************************/
    async register() {
        try {
            let fieldsArray = ['emailId', 'password', 'firstname', 'lastname', 'mobile'], emptyFields;
            emptyFields = await new CommonServices().checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_DATA + " " + emptyFields.toString() + " fields required." });
            }
            let filter = { emailId: this.req.body.emailId.toLowerCase() };
            // check emailId exists or not
            let user = await Users.findOne(filter).select('_id');
            if (user) { return this.res.send({ status: 0, message: responseMessages.DUPLICATE_EMAIL }); }

            // check mobile is exist or not
            filter = { mobile: this.req.body.mobile.toLowerCase() };
            user = await Users.findOne(filter).select('_id');
            if (user) {
                return this.res.send({ status: 0, message: responseMessages.DUPLICATE_MOBILE });
            }
            else {
                let data = this.req.body;
                let password = await new CommonServices().ecryptPassword(data.password);
                data.password = password;

                // Store the user in the Database
                const newUser = await new Users(data).save();

                if (_.isEmpty(newUser)) {
                    return this.res.send({ status: 0, message: responseMessages.USER_NOT_SAVED })
                }
                return this.res.send({ status: 1, message: responseMessages.REGISTRATION_SUCCESS });
            }
        } catch (error) {
            console.error("error in the register ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************
      @description  Login Process of the User
      @param 
      {
          "emailId":"testuser@grr.la",
          "password":"Test@123"
      }
      @returns JSON object along with the accessToken
  ************************************************************/
    async login() {
        try {
            let filter = { emailId: this.req.body.emailId };

            // Verifying whether the User exists in the Database or Not
            const user = await Users.findOne(filter).exec();
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: responseMessages.USER_NOT_EXIST });
            }
            if (user.isDeleted) { return this.res.send({ status: 0, message: responseMessages.USER_DELETED_BY_ADMIN }); }

            // Verifying the Password
            const status = await new CommonServices().verifyPassword({ password: this.req.body.password, savedPassword: user.password });
            if (!status) {
                return this.res.send({ status: 0, message: responseMessages.INVALID_PASSWORD });
            }

            // Generating the token for the loggedIn User
            let token = await new CommonServices().generateAuthToken(user._id), tokenExpiryTime = moment().add(parseInt(Config.tokenExpirationTime), 'minutes');

            await Users.findByIdAndUpdate(user._id, { $set: { accessToken: token, tokenExpiryTime: tokenExpiryTime, lastSeen: new Date() } }).exec();

            return this.res.send({ status: 1, message: responseMessages.LOGIN_SUCCESS, data: { accessToken: token } });
        } catch (error) {
            console.error(`error in the login ::: ${error}`);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************
      @description  Profile details of the User
      @param 
      headers: {
          "authorization": Authorization Token
      }
      @returns JSON object with the User Profile Details
  ************************************************************/
    async userProfile() {
        try {
            const userDetails = await Users.findById(this.req.authenticatedUser._id).select('_id firstname lastname mobile emailId').exec();
            return this.res.send({ status: 1, message: responseMessages.DETAILS, data: { userDetails } });
        } catch (error) {
            console.error("error in the editUserProfile ::::  ", error);
            return this.res.send({ status: 0, message: responseMessages.SERVER_ERROR });
        }
    }

    /***********************************************************
      @description   Update the profile details of the User
      @param 
      {
            "firstname":"Test-User",
            "lastname":"User",
      }
      @returns JSON object with updated profile details of the User
  ************************************************************/
    async editUserProfile() {
        try {
            const currentUser = this.req.authenticatedUser && this.req.authenticatedUser._id ? this.req.authenticatedUser._id : "";
            let fieldsArray = ['firstname', 'lastname', 'mobile'], emptyFields;
            emptyFields = await new CommonServices().checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_DATA + " " + emptyFields.toString() + " fields required." });
            }
            if (this.req.body.emailId) { delete this.req.body.emailId; }
            if (this.req.body.password) { delete this.req.body.password; }
            let data = this.req.body;
            const updatedUser = await Users.findByIdAndUpdate(currentUser, data).select('firstname lastname mobile').exec();
            if (!updatedUser) { return this.res.send({ status: 0, message: responseMessages.USER_NOT_UPDATED }); }
            return this.res.send({ status: 1, message: responseMessages.DETAILS_UPDATED, data: { updatedUser } });
        } catch (error) {
            console.error("error in the editUserProfile ::::  ", error);
            return this.res.send({ status: 0, message: responseMessages.SERVER_ERROR });
        }
    }

    /***********************************************************
      @description   Update the profile details of the User
      @param 
      {
          "emailId": "demouser@grr.la"
      }
      @returns JSON object with updated profile details of the User
  ************************************************************/
    async forgotPassword() {
        try {
            if (!this.req.body.emailId) { return this.res.send({ status: 0, message: responseMessages.SEND_MAIL }) }
            let emailId = this.req.body.emailId;
            let user = await Users.findOne({ emailId: emailId });
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: responseMessages.MAIL_NOT_EXISTS })
            }
            const token = await new CommonServices().generateAuthToken(user._id);
            let forgotTokenCreationTime = moment(user.forgotTokenCreationTime).add(parseInt(Config.forgotTokenExpireTime), 'minutes');
            await Users.findByIdAndUpdate(user._id, { forgotToken: token, forgotTokenCreationTime: forgotTokenCreationTime });
            return this.res.send({ status: 1, message: responseMessages.CHECK_EMAIL, data: { forgotToken: token } });
        } catch (error) {
            console.error("error- ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************
      @description   To reset the password by the user
      @param 
      {
          "token": token that was sent to the User's Mail,
          "password":"Test#123"
      }
      @returns JSON object with message as Password updated successfully
  ************************************************************/
    async resetPassword() {
        try {
            let fieldsArray = ['token', 'password'], emptyFields;
            emptyFields = await new CommonServices().checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_DATA + " " + emptyFields.toString() + " fields required." });
            }
            const decoded = await CommonServices.decodeUserForgotToken(this.req.body.token);
            if (!decoded) {
                return this.res.send({ status: 0, message: responseMessages.LINK_EXPIRED });
            }

            let user = await Users.findOne({ forgotToken: this.req.body.token });
            if (_.isEmpty(user)) {
                return this.res.send({ status: 0, message: responseMessages.INVALID_TOKEN });
            }

            let password = await (new CommonServices()).ecryptPassword(this.req.body.password.trim());

            const updateUser = await Users.findByIdAndUpdate(user._id, { $set: { password: password, forgotToken: "", forgotTokenCreationTime: "" } }, { new: true });
            if (_.isEmpty(updateUser)) {
                return this.res.send({ status: 0, message: responseMessages.PASSWORD_NOT_UPDATED });
            }
            return this.res.send({ status: 1, message: responseMessages.PASSWORD_UPDATED_SUCCESSFULLY });
        } catch (error) {
            console.error("error in the resetPassword ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************************
      @description   To send Notifications to the User on a scheduled Todo Item
      @param 
      {
            "todoId":"5f80633c88b1571e70c36ce9",
            "userId":"5f7f58b6629e655bfdd5a92e",
            "scheduleTime":"2020-11-08T18:21:42.799Z"
      }
      @returns JSON object with message as Notification has been scheduled successfully
  *************************************************************************/
    async scheduleNotifications() {
        try {
            let fieldsArray = ['scheduleTime', 'todoId', 'userId'], emptyFields;
            emptyFields = await new CommonServices().checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_DATA + " " + emptyFields.toString() + " fields required." });
            }
            const currentUser = this.req.authenticatedUser && this.req.authenticatedUser._id ? this.req.authenticatedUser._id : "";
            let data = this.req.body;
            let fetchUser = await Users.findById(ObjectId(data.userId));
            if (!fetchUser) { return this.res.send({ status: 0, message: responseMessages.USER_NOT_EXIST }); }

            let fetchTodo = await Todos.findById(ObjectId(data.todoId));
            if (!fetchTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_NOT_EXISTS }); }

            let scheduleTime = new Date(data.scheduleTime);
            if (Date.parse(new Date(scheduleTime)) < Date.parse(new Date())) {
                return this.res.send({ status: 0, message: responseMessages.SCHEDULE_TIME_SHOULD_BE_GREATER_THAN_TODAY });
            }

            let minutes = new Date(scheduleTime).getMinutes(), hours = new Date(scheduleTime).getHours(), dayOfMonth = new Date(scheduleTime).getDate(), month = new Date(scheduleTime).getMonth(),
                dayOfWeek = new Date(scheduleTime).getDay(), username = fetchUser.firstname + " " + fetchUser.lastname, todoName = fetchTodo.todoName;

            let scheduledTodoData = { minutes, hours, dayOfMonth, month, dayOfWeek, username, todoName }

            new CommonServices().scheduleCronJobs(scheduledTodoData);
            let messageToDisplay = `Notification for the user ${username} has been scheduled on the todo ${fetchTodo.todoName}`
            return this.res.send({ status: 1, message: messageToDisplay });
        } catch (error) {
            console.error("error in the scheduleNotifications ", error);
            return this.res.send({ status: 0, message: error });
        }
    }
}
module.exports = UserController;
