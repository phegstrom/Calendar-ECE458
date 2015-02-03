var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var collectionName = 'rulesC';

var RuleSchema = new Schema({
	canView: [{type: Schema.Types.ObjectId, ref: 'User'}],
	canViewBusy: [{type: Schema.Types.ObjectId, ref: 'User'}],
	canNotView: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {collection: collectionName});

RuleSchema.methods.addUserGroupView = function (cb) {
	//this.canView.push(ObjectID of each user);
	//this.save(cb);
};

RuleSchema.methods.addUserGroupBusy = function (cb) {
	//this.canView.push(ObjectID of each user);
	//this.save(cb);
};

module.exports = mongoose.model('Rule', RuleSchema);