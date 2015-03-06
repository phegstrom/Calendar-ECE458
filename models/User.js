var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');
    collectionName = "usersC";
    PUD = require('./PUD');

var deepPopulate = require('mongoose-deep-populate');

// note other fields are created by the .plugin() method below
var UserSchema = new Schema({
	name: String,
	myCalId: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	modCalId: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	canView: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	canViewBusy: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	userGroups: [{type: Schema.Types.ObjectId, ref: 'UserGroup'}],
	eventRequests: [{type: Schema.Types.ObjectId, ref: 'Request'}], // ev requests sent to me
	createdRequests: [{type: Schema.Types.ObjectId, ref: 'Request'}], 
	PUDs: [{type: Schema.Types.ObjectId, ref: 'PUD'}],
	createdSSEvents: [{type: Schema.Types.ObjectId, ref: 'SlotSignUp'}],
	SSEvents: [{type: Schema.Types.ObjectId, ref: 'SlotSignUp'}], // ssu requests sent to me
	mySlots: [{type: Schema.Types.ObjectId, ref: 'Slot'}],
	dateCreated: {type: Date, default: Date.now}
}, {collection: collectionName});

var options = {usernameField: 'email'};
//console.log('Account schema created');
UserSchema.plugin(passportLocalMongoose, options);

UserSchema.plugin(deepPopulate);

// returns a promise that will give access to array of ids
UserSchema.statics.convertToIds = function (emails) {
	return this.find({email: {$in: emails}}, '_id').exec();
};

UserSchema.statics.toIds = function (emails, cb) {
	this.find({email: {$in: emails}}, '_id', function (err, ids) {
		cb(err, ids);
	});
}

// returns array of emails
UserSchema.statics.toEmails = function (ids, cb) {
	var toRet = [];
	this.find({_id: {$in: ids}}, 'email', function (err, ret) {
		roRet = _.pluck(ret, 'email');
		cb(err, toRet);
	});
}

// called from Event Schema, returns in cb highest priority PUD
UserSchema.methods.getBestPUD = function (alottedTime, cb) {
	var pudArray = this.PUDs;

	this.model('User').findOne({_id: this._id}).populate('PUDs').exec(function (err, user) {
		// console.log(user);
		if (err) next(err);
		var didBreak = false;
		var pudArray = user.PUDs;
		for (var i = 0; i < pudArray.length; i++) {
			if (pudArray[i].time <= alottedTime) {
				cb(pudArray[i]);
				didBreak = true;
				break;
			}
		}

		if (!didBreak)
			cb(null);
		
	});
};


module.exports = mongoose.model('User', UserSchema);