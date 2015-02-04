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

// return all assocUsers and users in assocUserGroups without repeats
RuleSchema.methods.getAllUsersInRule = function (cb) {
	var toRet = [];

	for (var i = 0; i < this.assocUserGroups.length; i++) {
		toRet.push(this.assocUserGroups[i]);
	}
	for (var i = 0; i < this.assocUsers.length; i++) {
		if(toRet.indexOf(this.assocUsers[i]) == -1)
			toRet.push(this.assocUsers[i].toString());
	}

	return toRet;
};

module.exports = mongoose.model('Rule', RuleSchema);