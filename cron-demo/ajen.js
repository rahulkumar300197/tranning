var fs = require("fs");
var timezoneList = require('timezone-list').getTimezones();
console.log(timezoneList);
fs.writeFile("test.js",timezoneList, function(err) {
      if(err) {
        return console.log(err);
      }
    });

