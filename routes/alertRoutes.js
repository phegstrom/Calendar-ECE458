var express     = require('express');
var nodemailer 	= require('nodemailer');
var router      = express.Router();
var Event       = require('../models/Event');
var Alert 		= require('../models/Alert');
var User 		= require('../models/User');


var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'soCal458@gmail.com',
        pass: 'soCal458password'
    }
});

setInterval(intervalFunction, 1000 * 60);

// send mail with defined transport object

 
function intervalFunction() {
	var now = new Date();
	var lowerBound = new Date();
	lowerBound.setMinutes(lowerBound.getMinutes() - 1);
	var upperBound = new Date();
	upperBound.setMinutes(upperBound.getMinutes() + 1);
	// console.log(lowerBound);
	// console.log(upperBound);
	// console.log(now);
	// Alert.findOne({_id: '54d1f1a799bf6b887dbcdf7c'})
	Alert.findOne({time: {$gte: lowerBound, $lt: upperBound}})
		.populate('myEvent')
		.exec(function (err, alert) {
			if (err) next(err);
			// console.log(alert);
			if(alert) {
				User.findOne({_id: alert.owner})
					.exec( function (err, user) {

				var htmlString = createEventEmail(alert);
	          	var mailOptions = setOptions(htmlString, user.email);

		      console.log("sending email...");
		      // console.log(htmlString);
		      // console.log(mailOptions);
		      //console.log(event_t);

		       if (alert) {
		          transporter.sendMail(mailOptions, function(error, info) {
		                if (error) {
		                    console.log(error);
		                } else {
		                    console.log('Message sent: ' + info.response);
		                }
		                Event.findOneAndUpdate({_id: alert.myEvent._id}, {$pull: {alerts: alert._id}}, function (err, num, raw) {
		                	if (err) next(err);
		                	// console.log('Alert deleted from event object');
		                });
		                Alert.findOneAndRemove({_id: alert._id}, function (err) {
		                	if (err) next(err);
		                	// console.log('deleted alert object');		                	
		                });
		            });
		        }
		       // res.redirect('/');
			});
		}
		});
}

// takes in Alert populated with Event object
function createEventEmail(alert) {
	var date = new Date();
    var toRet = '';
    toRet += '<b>Event Name: </b>';
    toRet += alert.myEvent.name + ' <br> ';
    toRet += '<b>Description: </b>';
    toRet += alert.myEvent.description + ' <br>';
    toRet += '<b>Start Time: </b>';
    toRet += alert.myEvent.start.getMonth() + '/' + 
             alert.myEvent.start.getDate() + '/' +  
             alert.myEvent.start.getYear() + 
             ' at ' + alert.myEvent.start.toTimeString() + ' <br>';
    toRet += '<b>Request Alert Time: </b>';             
    toRet += alert.time.getMonth() + '/' + 
             alert.time.getDate() + '/' +  
             alert.time.getYear() + 
             ' at ' + alert.time.toTimeString() + ' <br>';             
    toRet += '<b>Current Time: </b>' + date.toTimeString();


    return toRet;
}


function setOptions(htmlString, email) {
    var mailOptions = {
        from: 'soCal Staff <foo@blurdybloop.com>', // sender address', // sender address
        to: email, // list of receivers
        subject: 'A friendly reminder!', // Subject line
        text: 'See below for your event information:', // plaintext body
        html: htmlString // html body
    }; 

    return mailOptions;
}

module.exports = router;