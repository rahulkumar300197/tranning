const Hapi = require('hapi');
const server = new Hapi.Server();

server.connection({
   host : 'localhost',
   port : 3000
});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request,reply) {
        reply('Hello HAPI');
        
    }
});

server.start(function (err) {
   if(err){
       throw err;
   }      
   console.log('Server started at: '+server.info.uri);   
 
});