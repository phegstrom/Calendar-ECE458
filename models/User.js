var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	email: {type: String, required: true, unique: true},
	salt: {type: String, required: true},
	password: {type: String, required: true},
	name: {type: String, required: true},
	modCalId: [{type: ObjectId, ref: 'Calendar'}]
	assocCalId: [{type: ObjectId, ref: 'Calendar'}]
	userGroups: [{type: ObjectId, ref: 'UserGroup'}]

});

mongoose.model('User', UserSchema);

