var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
//var session = require('cookie-session');
var session = require('client-sessions');
var bodyParser = require('body-parser');
var fs = require('fs');

// Added - if you add new modules, put the import text here
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var routes = require('./routes/index');
var users = require('./routes/users');

var loginRoutes = require('./routes/loginRoutes');
var calendarRoutes = require('./routes/calendarRoutes');
var eventRoutes = require('./routes/eventRoutes');
var ruleRoutes = require('./routes/ruleRoutes');
var userRoutes = require('./routes/userRoutes');
var usergroupRoutes = require('./routes/usergroupRoutes');
var alertRoutes = require('./routes/alertRoutes');
var requestRoutes = require('./routes/requestRoutes');
var PUDRoutes = require('./routes/PUDRoutes');
var ssuRoutes = require('./routes/SlotSignUpRoutes');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
//app.use(session({ keys: ['secretkey1', 'secretkey2', '...']}));
app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
  cookieName: 'session',
  secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
  duration: 10 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 10 * 60 * 1000,
  cookie: {
    path: '/', // cookie will only be sent to requests under '/api'
    ephemeral: true, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
  }
}));

app.use(passport.initialize());
app.use(passport.session());

var User = require('./models/User');

//passport.use(new LocalStrategy(Account.authenticate()));
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// first dbString is heroku...
var dbString = 'mongodb://heroku_app34927807:t5nfn8tkm70nlfkgngbb61k1ht@ds051960.mongolab.com:51960/heroku_app34927807';
// developm112ent error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
        console.log(app.get('env'));
    });
    dbString = 'mongodb://localhost/Calendar';
}

mongoose.connect(dbString, function(err) {
    if(err) {
        console.log('connection error', err);
    } else {
        console.log('connection to local DB successful');
    }
});

// handles cookie auth, session vars
app.use(function(req, res, next) {
  if (req.session && req.session.user) {
    User.findOne({ email: req.session.user.email }, function(err, user) {
      if (user) {
        req.user = user;
        delete req.user.salt; // delete the password from the session
        delete req.user.hash;
        req.session.user = req.user;  //refresh the session value
        res.locals.user = user;
      }
      // finishing processing the middleware and run the route
      next();
    });
  } else {

    next();
  }
});

// load in middleware
app.use('/', loginRoutes);
app.use('/calendar', requireLogin, calendarRoutes);
app.use('/event', requireLogin, eventRoutes);
app.use('/rule', requireLogin, ruleRoutes);
app.use('/user', requireLogin, userRoutes);
app.use('/usergroup', requireLogin, usergroupRoutes);
app.use('/alert', alertRoutes);
app.use('/pud', requireLogin, PUDRoutes);
app.use('/request', requireLogin, requestRoutes);
// app.use('/ssu', postMANTest, ssuRoutes);
app.use('/ssu', requireLogin, ssuRoutes);

// insert specific user id here when testing with POSTman
function postMANTest(req, res, next) {
  req.session = {user: {_id: "54fa1613f4aeec855017e1e0", email: "bbb"}};
  next();
}

function requireLogin (req, res, next) {
  if (!req.user) {
    res.redirect('/login');
  } else {
    next();
  }
};
 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers



// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



module.exports = app;
