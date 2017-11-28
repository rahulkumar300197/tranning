//var moment = require('moment-timezone');
//console.log(moment().tz("Asia/Kolkata").format("hA"));
var date = new Date();
var hours = date.getHours();
var minutes = date.getMinutes();
var offset = date.getTimezoneOffset() / 60;

minutes= (minutes/60);
hours=hours+minutes;

console.log(date);
console.log(offset);
//console.log(hours+":"+min);
console.log(hours);
var utc = hours+offset;
if(utc>24){
  utc-=24;
}
else if(utc<0){
  utc+=24; 
}
console.log(utc);
