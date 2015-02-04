var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserGroup 	= require('../models/UserGroup');
var collectionName = 'rulesC';

// for the enum type
var states = 'canView canViewBusy canNotView'.split(' ');

console.log(states);

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
RuleSchema.methods.getAllUsersInRule = function () {
	var toRet = [];

	for (var i = 0; i < this.assocUsers.length; i++) {
		// if(toRet.indexOf(this.assocUsers[i]) == -1)
		toRet.push(this.assocUsers[i]);
	}

	var promise = UserGroup.find({_id: {$in: this.assocUserGroups}})
		.exec(function (err, ugroups) {
			
		});

	promise.addBack(function(err, args) {
		for(var i = 0; i < args.length; i++) {
			for(var j = 0; j < args[i].users.length; j++) {
				if(toRet.indexOf(args[i].users[j]) == -1)
					toRet.push(args[i].users[j]);
			}
		}
		console.log(toRet);
		return toRet;
	});

	// for (var i = 0; i < this.assocUserGroups.length; i++) {
	// 		console.log(this.assocUserGroups[i]);
	// 		UserGroup.findOne({_id: this.assocUserGroups[i]}, function (err, ugroup) {
	// 			toRet.push(ugroup.users);
	// 			console.log(ugroup.users);
	// 		});
	// 		console.log("Did i get here");
	// 	// toRet.push(this.assocUserGroups[i]);
	// }

	// for (var i = 0; i < this.assocUsers.length; i++) {
	// 	if(toRet.indexOf(this.assocUsers[i]) == -1)
	// 		toRet.push(this.assocUsers[i]);
	// }

	// return toRet;
};

module.exports = mongoose.model('Rule', RuleSchema);