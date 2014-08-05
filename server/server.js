  // The main application script, ties everything together. a

var express = require('express');
var mongoose = require('mongoose');
var mongo = require('mongodb');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var app = express();
app.use(passport.initialize());
passport.use(new FacebookStrategy({
    clientID: 648798351882921,
    clientSecret: "fd19734e0be95df8f41499bbe345406e",
    callbackURL: "http://yo-banfa.azurewebsites.net/#/"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate(user.finduser(), function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
  }
));

//Mongo Configs
var mongoUri = process.env.MONGOLAB_URI ||
               process.env.MONGOHQ_URL ||
               // mongouri hard coded to link up to external database
               'mongodb://heroku_app27560425:la7uhgsbb2in87uuhdr4qqc8md@ds043467.mongolab.com:43467/heroku_app27560425';
               //'mongodb://localhost/mydb';


mongo.Db.connect(mongoUri, function (err, db) {
	db.collection('mydocs', function(er, collection) {
		collection.insert({'mykey': 'myvalue'}, {safe: true}, function (er,rs) {
        throw er;
        });
	});
});


// connect to Mongo when the app initializes
mongoose.connect(mongoUri);

//configure the server will all middleware and routing
require("./config/middleware.js")(app, express);

//export the app for testing and flexibility
module.exports = app;




