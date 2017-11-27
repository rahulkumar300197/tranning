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
              getData(data).then(result=>{  
                if(result.length!=0){ 
                  reply(result);
                }
              });     
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
    return new Promise(function(resolve, reject) {
      var data= new Array;
      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        db.collection('emp_test').find({name:id}).toArray(function(err, result) {
          if (err) throw err;
          console.log("Searching DataBase");  
         // console.log(result); 
          if(result.length != 0){
            //console.log("1");  
            resolve(result); 
          } 
          else{
           // console.log("2");  
            reject(result);
          }       
        });
      }); 
      
    })  

}

function getData(id){
  return new Promise(function(resolve, reject) { 
     //console.log(id);
     var data= [];

     client.lrange(id, 0, -1, function (error, items) {
       if (error) throw error;
      //  console.log("1");
       else if(items.length != 0 ) {
         console.log("Data from rediss");
         resolve(items);     
       }
       else db_getData(id).then(result=>{  
         if(result.length!=0){ 
         //  console.log("3"); 
           setData(result,id).then(result=>{resolve(result);}).catch(err=>{
             throw err;
           })
         }
       });        
     
     });
   })
}


function setData(data,dname){
   // console.log("4");  
  return new Promise(function(resolve, reject) {
    if(data[0] == null){
      console.log("Not found user "+dname);
     // console.log("5");
      reject(data);
    } 
    data.forEach(function (item){
      client.rpush(dname, JSON.stringify(item));
    });
  //  console.log("6");
    resolve(data);    
  })
}