var express     = require('express');
var nodemailer 	= require('nodemailer');
var router      = express.Router();
var Event       = require('../models/Event');
var Alert 		= require('../models/Alert');
var User 		= require('../models/User');
var PUD 		= require('../models/PUD');


// email we created to use in sending alerts to users
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'soCal458@gmail.com',
        pass: 'soCal458password'
    }
});


// this repeats the intervalFunction, sending emails
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
	Alert.findOne({time: {$gte: lowerBound, $lt: upperBound}}).populate('myEvent myPUD').exec(function (err, alert) {
		if (err) next(err);
		var htmlString;

		if(alert) {

			if (alert.myEvent != null) {
				htmlString = createEventEmail(alert);

				// delete the alert in the event
                Event.findOneAndUpdate({_id: alert.myEvent._id}, {$pull: {alerts: alert._id}}, function (err, num, raw) {
                	if (err) next(err);
                });
                Alert.findOneAndRemove({_id: alert._id}, function (err) {
                	if (err) next(err);
                });		

			} else if (alert.myPUD != null) { 
				htmlString = createPUDEmail(alert);
				updatePUDAlert(alert.myPUD, alert._id);
			}

          	var mailOptions = setOptions(htmlString, alert.ownerEmail);

			console.log("sending email...");

	      
          	transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Message sent: ' + info.response);
                }

            });

		}

	});
}

function updatePUDAlert(pudId, alertId) {
	console.log("updating PUD Alert info...");
	PUD.findOne({_id: pudId}, function (err, pud) {
		if (err) next (err);
        console.log(pud.alertInterval);
		if (pud.alertInterval == 0) {
            Alert.findOneAndRemove({_id: alertId}, function (err) {
            	if (err) next(err);
            	console.log("removing PUD alert");
            });	
		} else {
			Alert.findOne({_id: alertId}, function (err, alert) {
				console.log("updating PUD Alert time based on interval...");
				var tempDate = alert.time;
				alert.time = null;

				// tempDate.setDate(tempDate.getDate() + pud.alertInterval);
				tempDate.setMinutes(tempDate.getMinutes() + pud.alertInterval);
				alert.time = tempDate;

				alert.save(function (err, saved) {
					if (err) next(err);
				});
			
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
             alert.myEvent.start.getFullYear() + 
             ' at ' + alert.myEvent.start.toTimeString() + ' <br>';
    toRet += '<b>Request Alert Time: </b>';             
    toRet += alert.time.getMonth() + '/' + 
             alert.time.getDate() + '/' +  
             alert.time.getFullYear() + 
             ' at ' + alert.time.toTimeString() + ' <br>';             
    toRet += '<b>Current Time: </b>' + date.toTimeString();


    return toRet;
}

function createPUDEmail(alert) {
	var date = new Date();
    var toRet = '';
    toRet += '<b>PUD Name: </b>';
    toRet += alert.myPUD.description + ' <br> <br>';           
    toRet += '<b>This message was sent at: </b>' + date.toTimeString();

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