/****************************
 MONGOOSE SCHEMAS
 ****************************/
let config = require('./configs');
let mongoose = require('mongoose');

let mongoDBOptions = {
    retryWrites: true,
    connectTimeoutMS: 30000,
    useNewUrlParser: true
}

module.exports = () => {
    var db = mongoose.connect(config.db, mongoDBOptions).then(
        (connect) => { console.log('MongoDB connected') },
        (err) => { console.log('MongoDB connection error', err) }
    );
    mongoose.set('useCreateIndex', true);
    return db;
};
