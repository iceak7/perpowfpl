const express = require("express");
const app = express();

//TEST
app.use(express.static(__dirname + "/public"));

const port = process.env.PORT || 3400;
app.listen(port, () => console.log("port: " + port));
