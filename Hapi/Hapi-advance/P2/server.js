const Hapi = require('hapi');

const server = new Hapi.Server();

server.connection({
   host : 'localhost',
   port : 3000
});

server.register({
   register: require("inert")
   },
   function(err){
      if(err) throw err;
       
      server.route({
         method: 'GET',
         path: '/file.js',
         handler: function (request, reply) {
           reply.file("public/js/file.js"); 
         }   
      });

      server.route({
        method: 'GET',
        path: '/js/{file*}',
        handler: {
            directory:{
              path : "public/js",
              listing:true 
           }
        }   
     });

      server.start(function (err) {
        if(err) throw err;      
        console.log('Server started at: '+server.info.uri);  
      });
    }  

);
        
