var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'rulesC';

// for the enum type
var states = 'canView canViewBusy canNotView'.split(' ');

var RuleSchema = new Schema({
	ruleType: {type: String, enum: states},
	assocUsers: [{type: Schema.Types.ObjectId, ref: 'User'}],
	assocUserGroups: [{type: Schema.Types.ObjectId, ref: 'UserGroup'}]
}, {collection: collectionName});



RuleSchema.methods.addUserGroupView = function (cb) {
	//this.canView.push(ObjectID of each user);
	//this.save(cb);
};

RuleSchema.methods.addUserGroupViewBusy = function (cb) {
	//this.canView.push(ObjectID of each user);
	//this.save(cb);
};

module.exports = mongoose.model('Rule', RuleSchema);