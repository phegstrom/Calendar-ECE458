var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserGroupSchema = new Schema({
	name: {type: String},
	users: [type: ObjectId, ref: 'User']
});

mongoose.model('User', UserGroupSchema);

