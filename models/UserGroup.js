var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'usergroups';

var UserGroupSchema = new Schema({
	name: type: String,
	users: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: collectionName});

mongoose.model('UserGroup', UserGroupSchema);

