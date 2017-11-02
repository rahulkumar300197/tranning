var data = {  "u_name":"rahul310197" , "pass":"Rahul@31" };
//alert("dzhbAh");
function validate(){
    
    var user_name = document.getElementById("user").value;
    alert(user_name);
    var pass = document.getElementById("pass").value;
    if(user_name.match(data["u_name"]) && pass.match(data["pass"])){
   
      alert("Matched");
    }  
}