const responseMessages = require('../../services/ResponseMessages.json')
const Todos = require('./Schema').Todos;
const CommonServices = require('../../services/CommonServices');
const ObjectId = require('mongodb').ObjectID;

class TodoController {
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }

    /**************************************************************************************

    CONSIDERING THE TASK NAME(todoName) AS THE UNIQUE PARAMETER IN THE TODOS COLLECTION

    **************************************************************************************/

    /**********************************************************
         @description Adding or Updating the details of a Single Todo
         @param
        {
            "todoName":"task-ABC",
            "expirationTime":"2020-11-08T19:29:06.035Z",
            "todoId":"5f7fd6ba06bce11b78dcb380" (For Updating the Todo)
         }
         @returns Adding or Updating the details of a Single Todo
     ***********************************************************/
    async addUpdateTodo() {
        try {
            const currentUser = this.req.authenticatedUser && this.req.authenticatedUser._id ? this.req.authenticatedUser._id : "";
            // Checking whether the expirationTime(Date) is greater that Today or Not
            if (this.req.body.expirationTime && (Date.parse(new Date()) > Date.parse(new Date(this.req.body.expirationTime)))) {
                return this.res.send({ status: 0, message: responseMessages.EXPIRATION_TIME_SHOULD_BE_GREATER_THAN_TODAY });
            }
            // Below if block indicates ==> Updating the existing Task in the Database 
            if (this.req.body.todoId) {
                let fetchTodo = await Todos.findById(ObjectId(this.req.body.todoId)), updatedTodo;
                if (!fetchTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_NOT_EXISTS }); }
                else {
                    if (this.req.body.todoName) {
                        let todoDetails = await Todos.findOne({ _id: { $nin: fetchTodo._id }, todoName: this.req.body.todoName.trim() }).exec();
                        if (todoDetails) { return this.res.send({ status: 0, message: responseMessages.TODO_EXISTS }); }
                    }
                    await Todos.findByIdAndUpdate(fetchTodo._id, { $set: this.req.body });
                    updatedTodo = await Todos.findById(fetchTodo._id);
                    return this.res.send({ status: 1, message: responseMessages.DETAILS_UPDATED, data: { updatedTodo } });
                }
            }
            // Below else block indicates ==> Storing the details of a new Task in the Database 
            else {
                //    Task name, creation timestamp, edit timestamp, expiry, completion status.
                let fieldsArray = ['todoName', 'expirationTime'], emptyFields;
                emptyFields = await new CommonServices().checkEmptyWithFields(this.req.body, fieldsArray);
                if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                    return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_DATA + " " + emptyFields.toString() + " fields required." });
                }
                let data = this.req.body;
                let fetchTodo = await Todos.findOne({ todoName: data.todoName.trim(), isDeleted: false });
                if (fetchTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_EXISTS }); }

                data.addedBy = currentUser;
                // Saving the Task Data into the Database
                const storeTodo = await new Todos(data).save();
                if (!storeTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_NOT_STORED }); }
                return this.res.send({ status: 1, message: responseMessages.TODO_STORED, data: { storeTodo } });
            }
        } catch (error) {
            console.error("error in the addUpdateTodo ::::  ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************
        @description  To get the details of a single Todo
        @param   query   id: "5f7f58b6629e655bfdd5a92e"
        @returns Details of a Single Todo
    ***********************************************************/
    async getTodo() {
        try {
            if (!this.req.params.todoId) { return this.res.send({ status: 0, message: responseMessages.SEND_TODO }); }
            let fetchTodo = await Todos.findById(ObjectId(this.req.params.todoId)).select('_id todoName expirationTime status createdAt updatedAt');
            if (!fetchTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_NOT_EXISTS }); }
            return this.res.send({ status: 1, message: responseMessages.DETAILS, data: { fetchTodo } });
        } catch (error) {
            console.error("error in the getTodo ::::  ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************
       @description    To change the status of a Todo
        @param   todoIds ["5f7f58b6629e655bfdd5a92e", "5f4f7343c2991945ab30f938"]
        @returns JSON Object as the Status is updated
    ***********************************************************/
    async changeStatus() {
        try {
            let fieldsArray = ['todoIds', 'status'], emptyFields;
            emptyFields = await new CommonServices().checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_DATA + " " + emptyFields.toString() + " fields required." });
            }
            // Changing the status for the Multiple Todos
            let status = this.req.body.status.trim();
            if (status !== "completed" && status !== "pending" && status !== "expired") {
                return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_STATUS });
            }
            else {
                let updateTodo = await Todos.updateMany({ _id: { $in: this.req.body.todoIds } }, { $set: { status: this.req.body.status } });
                if (!updateTodo) { return this.res.send({ status: 0, message: responseMessages.STATUS_NOT_DELETED }); }
                return this.res.send({ status: 1, message: responseMessages.STATUS_UPDATED });
            }
        } catch (error) {
            console.error("error in the changeStatus ::::  ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************
        @description  To delete a set of Todos
        @param   todoIds:["5f7f58b6629e655bfdd5a92e", "5f4f7343c2991945ab30f938"]
        @returns JSON Object as Todos deleted successfully
   ***********************************************************/
    async deleteTodo() {
        try {
            const currentUser = this.req.authenticatedUser && this.req.authenticatedUser._id ? this.req.authenticatedUser._id : "";
            if (!this.req.body.todoIds || !this.req.body.todoIds.length) { return this.res.send({ status: 0, message: responseMessages.SEND_TODO }); }

            // Changing the isDeleted flag of the Todos from false to true which indicates that the Todos are deleted and they will not be visible in User's Perspective(Soft Delete)
            let updateTodo = await Todos.updateMany({ _id: { $in: this.req.body.todoIds } }, { $set: { isDeleted: true, deletedBy: currentUser } });
            if (!updateTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_NOT_DELETED }); }
            return this.res.send({ status: 1, message: responseMessages.TODO_DELETED });
        } catch (error) {
            console.error("error in the deleteTodo ::::  ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /************************************************************************
       @description  To get the list of all the Todos
        @param   
        3 types of Request Parameters
        1.) For the List of all the Todos(Not Deleted and Not Expired Todos)
                {
                  "page":1,
                  "pagesize":10
                }
        2.) Only the List of Deleted Todos(Not Expired Todos)
                {
                  "page":1,
                  "pagesize":10,
                  "isDeleted":true
                }
        3.) Only the List of Expired Todos(Not Deleted Todos)
                {
                  "page":1,
                  "pagesize":10,
                  "isExpired":true
                }
        @returns JSON Object with the list of all Todos
    *************************************************************************/
    async listTodos() {
        try {

            // Below Statement indicates updating the status of the Todos to "expired" whose expirationTime is less than current time 
            let updateTodos = await Todos.updateMany({ expirationTime: { $lte: new Date() } }, { $set: { status: 'expired' } });
            if (!updateTodos) { return this.res.send({ status: 0, message: responseMessages.TODOS_EXPIRATION_LIST_NOT_UPDATE }); }

            const currentUser = this.req.authenticatedUser && this.req.authenticatedUser._id ? this.req.authenticatedUser._id : "";
            let fieldsArray = ['page', 'pagesize'], emptyFields;
            emptyFields = await new CommonServices().checkEmptyWithFields(this.req.body, fieldsArray);
            if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
                return this.res.send({ status: 0, message: responseMessages.SEND_PROPER_DATA + " " + emptyFields.toString() + " fields required." });
            }
            let todosList, commonFilter = { addedBy: ObjectId(currentUser) }, filter;
            let data = this.req.body, skip = (data.page - 1) * data.pagesize;

            // To get the entire list of Todos(Except Deleted Todos)
            filter = { ...commonFilter, isDeleted: false, expirationTime: { $gte: new Date() } };

            // To get the entire list of Deleted Todos only
            if (this.req.body.isDeleted) {
                filter = { ...commonFilter, isDeleted: true };
            }

            // To get the entire list of Expired Todos only
            if (this.req.body.isExpired) {
                filter = { ...commonFilter, isDeleted: false, status: "expired" };
            }
            todosList = await Todos.find(filter).skip(skip).limit(data.pagesize).sort({ _id: -1 }).select('_id todoName status isDeleted expirationTime createdAt updatedAt').exec();
            return this.res.send({ status: 1, message: responseMessages.DETAILS, data: { todosList } });
        } catch (error) {
            console.error("error in the listTodos ::::  ", error);
            return this.res.send({ status: 0, message: error });
        }
    }

    /***********************************************************
    @description  To restore the set of Todos from deleted to "pending/expired" based on the expirationTime of the Todos
    @param   todoIds:["5f7f58b6629e655bfdd5a92e", "5f4f7343c2991945ab30f938"]
    @returns JSON Object as Todos restored successfully
 ***********************************************************/
    async restoreTodos() {
        try {
            const currentUser = this.req.authenticatedUser && this.req.authenticatedUser._id ? this.req.authenticatedUser._id : "";
            if (!this.req.body.todoIds || !this.req.body.todoIds.length) { return this.res.send({ status: 0, message: responseMessages.SEND_TODO }); }

            // Changing the isDeleted flag of the Todos from false to true which indicates that the Todos are deleted and they will not be visible in User's Perspective(Soft Delete)
            let updateTodo = await Todos.updateMany({ _id: { $in: this.req.body.todoIds }, expirationTime: { $gte: new Date() } }, { $set: { isDeleted: false, status: "pending", restoredBy: currentUser } });
            if (!updateTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_NOT_UPDATED }); }

            updateTodo = await Todos.updateMany({ _id: { $in: this.req.body.todoIds }, expirationTime: { $lte: new Date() } }, { $set: { isDeleted: false, status: "expired", restoredBy: currentUser } });
            if (!updateTodo) { return this.res.send({ status: 0, message: responseMessages.TODO_NOT_UPDATED }); }

            return this.res.send({ status: 1, message: responseMessages.TODO_UPDATED });
        } catch (error) {
            console.error("error in the restoreTodos ::::  ", error);
            return this.res.send({ status: 0, message: error });
        }
    }
}
module.exports = TodoController;
