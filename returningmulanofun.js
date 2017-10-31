function multiplier(factor) {
  return [ 
           function(number) {
              return number * factor;
           },
           function(number) {
              return number * factor;
           }
  ];
}

var twice = multiplier(2);
console.log(twice[0](5));
console.log(twice[1](10));