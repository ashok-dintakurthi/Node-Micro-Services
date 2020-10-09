/****************************
 EXPRESS AND ROUTING HANDLING
 ****************************/

const express = require('express');
const bodyParser = require('body-parser');
const glob = require("glob")
const fs = require('fs');

module.exports = function () {
    var app = express();

    app.use(bodyParser.urlencoded({
        limit: "50mb", //Controls the maximum size of the req body
        extended: true //In formData, If extended == false => the value can be a string or array(in  the key-value pairs) If extended == true, any value can be passed in the key-value pairs .
    }));

    app.use(bodyParser.json()); // Parses the application/json

    // To avoid CORS Issues
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.use(express.json());

    // To read all the routes.js files in all the folders in the modules folder which is in the app folder
    const modules = '/../app/modules';
    glob(__dirname + modules + '/**/*Routes.js', {}, (err, files) => {
        files.forEach((route) => {
            const stats = fs.statSync(route); // fs.statSync ==> will give the entire information(stats) about the file (like size, createdAt, ...)
            const fileSizeInBytes = stats.size; // There will some size of the file. If and only if the file contains some content in it.
            if (fileSizeInBytes) {
                require(route)(app, express);
            }
        });
    });


    return app;
};
