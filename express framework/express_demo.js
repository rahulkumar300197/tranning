var express=require('express');
var app = express();
app.use(express.static('public'));
var bodyParser = require('body-parser'); 
var urlencodeParser = bodyParser.urlencoded({extended:false});
app.get('/form',function(req,res){
    res.sendFile(__dirname+"/"+"form.html");
});
app.post('/process_post',urlencodeParser,function(req,res){
    response = {
         first_name:req.body.user, 
         last:req.body.last
    };
    console.log(response);
    res.end(JSON.stringify(response));
});

var server = app.listen(8081,function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log(host+" "+port);
});