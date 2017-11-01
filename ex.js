function urlparsing(url){     
    url_parts = url.match(/:\/\/(.[^/]+)/)[1].split('.');
    url_parts.shift();
    var domain = url_parts.join('.');
    console.log("Domain name:"+domain);   
};

urlparsing("http://www.abcde.com/xyz/as");