
module.exports = (app, express) => {

    const router = express.Router();
    const TodoController = require('./Controller');
    const CommonServices = require('../../services/CommonServices');

    router.post('/todos/addUpdateTodo', CommonServices.validateUser, (req, res) => {
        const todoObj = new TodoController(req, res);
        return todoObj.addUpdateTodo();
    })

    router.get('/todos/getTodo/:todoId', CommonServices.validateUser, (req, res) => {
        const todoObj = new TodoController(req, res);
        return todoObj.getTodo();
    })

    router.put('/todos/changeStatus', CommonServices.validateUser, (req, res) => {
        const todoObj = new TodoController(req, res);
        return todoObj.changeStatus();
    })

    router.delete('/todos/deleteTodo', CommonServices.validateUser, (req, res) => {
        const todoObj = new TodoController(req, res);
        return todoObj.deleteTodo();
    })

    router.post('/todos/list', CommonServices.validateUser, (req, res) => {
        const todoObj = new TodoController(req, res);
        return todoObj.listTodos();
    })

    router.post('/todos/restoreTodos', CommonServices.validateUser, (req, res) => {
        const todoObj = new TodoController(req, res);
        return todoObj.restoreTodos();
    })

    app.use(router);
}