var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/treaning";
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
         first_name:req.body.first_name, 
         last_name:req.body.last_name
    };
    console.log(response);
    res.end(JSON.stringify(response));
    insertData(response);
});

var server = app.listen(3000,function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log(host+" "+port);
});

function insertData(myobj){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        
        db.collection("class").insertOne(myobj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
        });
        db.close();  
     
    }); 
}
