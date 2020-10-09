const config = require('./configs/configs');
let mongoose = require('./configs/mongoose');
let express = require('./configs/express');
const app = express();
let connectToDb = mongoose();


app.get('/', (req, res) => {
    res.send('Hello World - Micro Node');
});


app.listen(config.serverPort, () => {
    console.log(`Server listening at ${config.serverPort}`);
})

