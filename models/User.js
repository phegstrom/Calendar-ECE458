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
	eventRequests: [{type: Schema.Types.ObjectId, ref: 'Request'}],
	createdRequests: [{type: Schema.Types.ObjectId, ref: 'Request'}],
	PUDs: [{type: Schema.Types.ObjectId, ref: 'PUD'}],
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

UserSchema.methods.getBestPUD = function (alottedTime, cb) {

	PUD.find({_id: {$in: this.PUDs}}).exec(function (err, puds) {
		for (var i = 0; i < puds.length; i++) {
			if (puds[i].time <= alottedTime) {
				cb(puds[i]);
			}
		}
		cb(null);
	});

};

module.exports = mongoose.model('User', UserSchema);