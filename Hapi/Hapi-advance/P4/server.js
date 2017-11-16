const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({
   host : 'localhost',
   port : 3000
});

server.register([
      {
          register : require('hapi-geo-locate'),
        
          options : {
              enabledByDefault : true
          }
      }
   ],
   function(err){
       if(err) throw err;

       server.route({
           method: 'GET',
           path: '/',
           handler: function (request, reply) {
              console.log(request.location); 
              reply(request.location);
           }   
       });

       server.start(function (err) {
          if(err){
              throw err;
          }      
          console.log('Server started at: '+server.info.uri);
    
       });


   }
);

