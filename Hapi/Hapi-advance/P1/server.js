const Hapi = require('hapi');

const server = new Hapi.Server();

server.connection({
   host : 'localhost',
   port : 3000
});

server.route({
   method: 'GET',
   path: '/',
   handler: function (request, reply) {
    var query = request.query;
    reply("It's working"+JSON.stringify(query)); 
   }   
});

server.route({
    method: 'POST',
    path: '/payload',
    handler: function (request, reply) {
      var payload = request.payload;
      reply(payload); 
    }   
 });
        
server.start(function (err) {
   if(err){
       throw err;
   }      
   console.log('Server started at: '+server.info.uri);  
    
 
});