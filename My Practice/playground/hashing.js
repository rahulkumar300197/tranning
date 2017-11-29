var jwt = require("jsonwebtoken");

var data = {
   id: 11
};

var token = jwt.sign(data,"abc123");
console.log(token);

var decode = jwt.verify(token,"abc123");
console.log(decode);