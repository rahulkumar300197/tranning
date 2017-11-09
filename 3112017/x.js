var process = require('process');
var f = require('child_process');
var fs = require('fs');

var test = fork('./test.js');
console.log('Server started');

fs.watchFile('./test.js', function (event, filename) {
    test.kill();
    console.log('Server stopped');
    test = fork('./test.js');
    console.log('Server started');
});

process.on('SIGINT', function () {
    test.kill();
    fs.unwatchFile('./test.js');
    process.exit();
});

