var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/stu');

var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var stu = new Schema({
    name: { type: String, default: 'hahaha' }
});

var Stus= mongoose.model('Stus', stu);

var ob1 = new Stus({ name: 'Silence' });

console.log(ob1.name); // 'Silence'

stu.methods.speak = function () {
    var greeting = this.name
      ? "Meow name is " + this.name
      : "I don't have a name";
   // console.log(greeting);
}

ob1.save(function (err, ob1) {
    if (err) return console.error(err);
    ob1.speak();
});
  


   
  