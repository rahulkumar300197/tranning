var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/treaning";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var myobj = [
    { name: 'John'},
    { name: 'Peter'},
    { name: 'Amy'},
    { name: 'Hannah'},
    { name: 'Michael'},
    { name: 'Sandy'},
    { name: 'Betty'},
    { name: 'Richard'},
    { name: 'Susan'},
    { name: 'Vicky'},
    { name: 'Ben'},
    { name: 'William'},
    { name: 'Chuck'},
    { name: 'Viola'}
  ];
 /* db.collection("student").insertMany(myobj, function(err, res) {
    if (err) throw err;
    console.log("Number of documents inserted: " + res.insertedCount);
    db.close();
  });  */

  db.collection("student").find({}).toArray(function(err, result) {
    if (err) throw err;
  console.log(result[0].Name);
  
    
    db.close();
  });
  
  console.log("\n");
 
  
}); 