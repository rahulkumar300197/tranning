var data = require('./userpass.json');
function validate(){
    alert("aehgAe");
    var user_name = document.getElementById("user");
    var pass = document.getElementById("pass");
    if(user_name.match(data["u_name"]) && pass.match(data["pass"])){
   
      alert("asgaEgA");
    }  
}