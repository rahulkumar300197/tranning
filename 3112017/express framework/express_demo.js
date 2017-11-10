var express=require('express');
var app = express();
app.use(express.static('public'));

app.get('/form',function(req,res){
    res.sendFile(__dirname+"/"+"form.html");
});
app.get('/process_get',function(req,res){
    response = {
         first_name:req.query.user, 
         last:req.query.last
    };
    console.log(response);
    res.send(JSON.stringify(response));
});

var server = app.listen(8081,function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log(host+" "+port);
});