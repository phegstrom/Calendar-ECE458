var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');
var Schema = mongoose.Schema;
var collectionName = 'usergroupsC';
var _ = require('underscore');

var UserGroupSchema = new Schema({
	name: String,
	users: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: collectionName});

UserGroupSchema.plugin(deepPopulate);

// returns array of all users (unique list)
// cb (err, uidArray)
UserGroupSchema.statics.getUserIds = function (ugroupIdArray, cb) {
	var uidArray = [];
	this.find({_id: {$in: ugroupIdArray}}, function (err, uGroups) {

		uGroups.forEach(function (uGroup) {
			uidArray = _.union(uidArray, uGroup.users);
		});

		cb(err, uidArray);
	});
};

module.exports = mongoose.model('UserGroup', UserGroupSchema);