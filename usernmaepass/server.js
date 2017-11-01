var http=require('http');
var fs=require('fs');


http.createServer(function(req, res)
{
 res.writeHead(200, { 'Content-Type': 'text/html' });
 var html=fs.readFileSync(__dirname+ '/login.html');
 //var ckeckjs=fs.readFileSync(__dirname+ '/check.js');
 //var datajson=fs.readFileSync(__dirname+ '/userpass.json');
 res.end(html);
 
 
}).listen(7000);