const Hapi = require('hapi');
var mysql      = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '3101',
  database : 'student'
});

const server = new Hapi.Server();

server.connection({
   host : 'localhost',
   port : 3000
});

connection.connect();

server.route({
   method: 'GET',
   path: '/',
   handler: function (request, reply) {
       //reply('working');
       connection.query('SELECT * from student', function (error, results, fields) {
          if (error) throw error;
          reply('The solution is: '+results[0].name+' '+results[0].age);
       });
       connection.end();
   }
        
});
        
server.start(function (err) {
   if(err){
       throw err;
   }      
   console.log('Server started at: '+server.info.uri);  
    
 
});
