
module.exports = (app, express) => {

    const router = express.Router();
    const UserController = require('./Controller');
    const CommonServices = require('../../services/CommonServices');

    router.post('/users/register', (req, res) => {
        const userObj = new UserController(req, res);
        return userObj.register();
    })

    router.post('/users/login', (req, res) => {
        const userObj = new UserController(req, res);
        return userObj.login();
    })

    router.get('/users/profile', CommonServices.validateUser, (req, res) => {
        const userObj = new UserController(req, res);
        return userObj.userProfile();
    })

    router.post('/users/updateProfile', CommonServices.validateUser, (req, res) => {
        const userObj = new UserController(req, res);
        return userObj.editUserProfile();
    })

    router.post('/users/forgotPassword', (req, res) => {
        const userObj = new UserController(req, res);
        return userObj.forgotPassword();
    })

    router.post('/users/resetPassword', (req, res) => {
        const userObj = new UserController(req, res);
        return userObj.resetPassword();
    })

    router.post('/users/scheduleNotifications', CommonServices.validateUser, (req, res) => {
        const userObj = new UserController(req, res);
        return userObj.scheduleNotifications();
    })

    app.use(router);
}