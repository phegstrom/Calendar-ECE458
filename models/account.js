var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');
    collectionName = "users";

var UserSchema = new Schema({
	username: String,
}, {collection: collectionName});

var options = {usernameField: 'email'};
//console.log('Account schema created');
UserSchema.plugin(passportLocalMongoose, options);

module.exports = mongoose.model('User', UserSchema);