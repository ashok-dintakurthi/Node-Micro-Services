var mongoose = require('mongoose');
var schema = mongoose.Schema;

var todosSchema = new schema({
    todoName: { type: String, trim: true, unique: true, required: true },
    expirationTime: { type: Date },
    addedBy: { type: schema.Types.ObjectId, ref: 'users' },
    status: { type: String, enum: ['completed', 'pending', 'expired'], default: 'pending' },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: schema.Types.ObjectId, ref: 'users' },
    restoredBy: { type: schema.Types.ObjectId, ref: 'users' }
}, {
        timestamps: true
    });

let Todos = mongoose.model('todos', todosSchema);
module.exports = { Todos }