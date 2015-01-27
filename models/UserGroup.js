var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'usergroups';

var UserGroupSchema = new Schema({
	name: String,
	users: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: collectionName});

module.exports = mongoose.model('UserGroup', UserGroupSchema);