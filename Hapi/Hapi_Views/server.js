const Hapi = require('hapi');
const server = new Hapi.Server();

server.connection({
   host : 'localhost',
   port : 3000
});

server.register(require('vision'), (err) => {
    
        if (err) {
            throw err;
        }
    
        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, reply) {
                reply.view('index',{name : "Rahul"});
            }
        });

        server.route({
            method: 'GET',
            path: '/users/{userName}',
            handler: function (request, reply) {
                var name = encodeURIComponent(request.params.userName);
                reply.view('index',{name : name});
            }
        });

        server.views({
           engines:{
               html : require('handlebars')
           }, 
           relativeTo: __dirname,
           path : 'templates'      
        
        });
          

});


server.start(function (err) {
   if(err){
       throw err;
   }      
   console.log('Server started at: '+server.info.uri);  
    
 
});