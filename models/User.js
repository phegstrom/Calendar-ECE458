var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');
    collectionName = "users";

// note other fields are created by the .plugin() method below
var UserSchema = new Schema({
	name: String,
	modCalId: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	assocCalId: [{type: Schema.Types.ObjectId, ref: 'Calendar'}],
	userGroups: [{type: Schema.Types.ObjectId, ref: 'UserGroup'}],
	dateCreated: {type: Date, default: Date.now},
	testString: {type: String}
}, {collection: collectionName});

var options = {usernameField: 'email'};
//console.log('Account schema created');
UserSchema.plugin(passportLocalMongoose, options);

module.exports = mongoose.model('User', UserSchema);