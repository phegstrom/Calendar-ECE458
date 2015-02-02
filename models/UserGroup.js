var mongoose = require('mongoose');
// var deepPopulate = require('mongoose-deep-populate');
var Schema = mongoose.Schema;
var collectionName = 'usergroupsC';

var UserGroupSchema = new Schema({
	name: String,
	users: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: collectionName});

module.exports = mongoose.model('UserGroup', UserGroupSchema);