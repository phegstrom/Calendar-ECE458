var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RepeatSchema = new Schema({
	Frequency: {type: Number},
	end: {type: Date},
	days: [{type: Date}]
});

mongoose.model('Repeat', RepeatSchema);

