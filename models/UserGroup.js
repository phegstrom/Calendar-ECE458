var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserGroupSchema = new Schema({
	name: {type: String},
	users: [type: Schema.ObjectId, ref: 'User']
});

mongoose.model('User', UserGroupSchema);

