const Hapi = require('hapi');
const redis = require('redis');
const client = redis.createClient();

client.on('connect', function(){
  console.log('Connected to Redis...');
});

const server = new Hapi.Server();

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/treaning";

server.connection({
   host : 'localhost',
   port : 3001
});

server.register(require('inert'), (err) => {
    
        if (err) {
            throw err;
        }
    
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {
                reply.file('./public/form.html');
            }
        });
        
        server.route({
            method: 'POST',
            path: '/search_process',
            config: {
                payload: {
                    output: 'data'
                }
            },
            handler: async function (request, reply) {
                var data=request.payload.name;                           
                console.log(data);
               //// var usr_data = new array();
                //var usr_data=  await getData(data);
                
           
            }
        });    

});


server.start(function (err) {
   if(err){
       throw err;
   }      
   console.log('Server started at: '+server.info.uri);  
    
 
});

function db_getData(id){
    var data= new Array;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('emp_test').find({name:id}).toArray(function(err, result) {
          if (err) throw err;
          console.log("Searching DataBase");
          return setData(result,id);
          
        });
    }); 
    return data;

}

function getData(id)
{   console.log(id);
    var data= [];

    client.lrange(id, 0, -1, function (error, items) {
        if (error) throw error;
      //  console.log("1");
        else if(items.length != 0 ) {
            console.log("Data from rediss");
            var x=items;
            console.log(x);
            //console.log(typeof items[0]);

            return x;
            
        }
        else return db_getData(id);        
           
         
    });
}


function setData(data,dname)
{ if(data[0] == null){
    console.log("Not found user "+dname);
    return ;
  } 
  //console.log("dvd");
  console.log(data);
  // dname.toLower(); 
  console.log(dname);
  // client.(dname,data);
    data.forEach(function (item){
     client.rpush(dname, JSON.stringify(item)
        , function(err, reply){
         if(err) console.log(err);
         console.log("Data added to redis");
         return  data;
     });
   });
     
}