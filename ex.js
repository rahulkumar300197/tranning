function url_parsing(url){  
    url_parts=url.match(/^((http[s]?|ftp):\/)?\/?([^:\/\s]+)(:([^\/]*))?((\/[\w\/-]+)*\/)([\w\-\.]+[^#?\s]+)(\?([^#]*))?(#(.*))?$/i);
    
    
    console.log(url_parts);   
};

url_parsing("http://www.example.com:123/foo/bar?fox=trot");