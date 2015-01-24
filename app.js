var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

// Added - if you add new modules, put the import text here
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('cookie-session');

var routes = require('./routes/index');
var users = require('./routes/users');
var loginRoutes = require('./routes/loginRoutes');

var User = require('./models/account');



var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ keys: ['secretkey1', 'secretkey2', '...']}));

app.use('/', loginRoutes);
app.use('/users', users);


app.use(passport.initialize());
app.use(passport.session());

//passport.use(new LocalStrategy(Account.authenticate()));
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Added
mongoose.connect('mongodb://localhost/Calender', function(err) {
    if(err) {
        console.log('connection error', err);
    } else {
        console.log('connection to local DB successful');
    }
});

//load all files in models dir
// fs.readdirSync(__dirname + '/models').forEach(function(filename) {
//   if (~filename.indexOf('.js')) require(__dirname + '/models/' + filename)
// });


// app.get('/User', function(req, res) {
//     mongoose.model('User').find(function(err, User) {
//         res.send(User);
//     });
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

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
