function countChar(str,ch){
   var count=0; 
   for(var i=0;i<str.length;i++){
     if(str.charAt(i)==ch)
       count++;
   }
   return count;  
}
function countBs(str){
   return countChar(str,"B");
}

console.log(countBs("BBC"));
// → 2
console.log(countChar("kakkerlak", "k"));
// → 4