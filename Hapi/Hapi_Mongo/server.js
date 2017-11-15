const Hapi = require('hapi');
const server = new Hapi.Server();

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/treaning";

server.connection({
   host : 'localhost',
   port : 3000
});

server.register(require('inert'), (err) => {
    
        if (err) {
            throw err;
        }
    
        server.route({
            method: 'GET',
            path: '/form',
            handler: function (request, reply) {
                reply.file('./public/form.html');
            }
        });
        server.route({
            method: 'POST',
            path: '/form_process',
            config: {
                payload: {
                    output: 'data'
                }
            },
            handler: function(request, reply) {
                var data={ fname:request.payload.f_name,
                           lname:request.payload.l_name 
                }; 
                console.log(data);
                insertData(data);
                reply(JSON.stringify(data));
            }
        });    

});


server.start(function (err) {
   if(err){
       throw err;
   }      
   console.log('Server started at: '+server.info.uri);  
    
 
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
