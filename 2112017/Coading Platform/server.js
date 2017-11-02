var http = require('http');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');

var server = http.createServer(function (req, res) {
    if (req.method.toLowerCase() == 'get') {
        displayWindow(res);
    } else if (req.method.toLowerCase() == 'post') {
        getCode(req, res);
    }
});

function displayWindow(res) {
    fs.readFile('form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

function getCode(req, res) {
    
    var fields = [];
    var form = new formidable.IncomingForm();
    
    form.on('field', function (field, value) {
        fields[field] = value;
    });
    
    var stream = fs.createWriteStream("code.js");
    stream.once('open', function(fd) {
      stream.write(fields["code"]);
      stream.end();
    });
    form.parse(req);
}


server.listen(7000);
console.log("server listening on 7000");