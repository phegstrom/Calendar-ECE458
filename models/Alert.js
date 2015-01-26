var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AlertSchema = new Schema({
	//number or date?
	time: {type: Number},
	method: {type: String}

});

mongoose.model('Alert', AlertSchema);

