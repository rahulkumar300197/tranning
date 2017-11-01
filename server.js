var http=require('http')
var server=http.createServer( function (request,response){
    console.log(Object.keys(request));
    if(request.method=='GET'){
       response.end(request.url);
    }	
    else{
        response.end("Method not allowed");    }
});

server.listen(7000);