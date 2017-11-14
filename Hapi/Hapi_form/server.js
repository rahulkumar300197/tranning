const Hapi = require('hapi');
const server = new Hapi.Server();

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