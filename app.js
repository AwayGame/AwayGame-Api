//https://www.yelp.com/developers/documentation/v3/business_search
//https://www.sitepoint.com/writing-api-documentation-slate/
//

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var firebase = require('firebase');
require('firebase/firestore');
rp = require('request-promise');
config = require('./config');
API = require('./api/index');

var users = require('./routes/users');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

//database connection
var firebase = firebase.initializeApp(config.firebaseConfig);
db = firebase.firestore();

//define endpoints
//cities
app.get('/api/cities', function(req, res) {
    return API.CitiesAndTeams.getCities(req, res);
});

app.get('/api/getTeamsFromCity/:cityId', function(req, res) {
	return API.CitiesAndTeams.getTeamsFromCity(req, res);
})

app.post('/api/events/', function(req, res) {
	return API.Events.searchTicketMasterForEvents(req, res);
})


//Gets locations of places to eat based on user input
app.post('/api/getLocationsOfRestaurants', function(req, res) {
    return API.Business.getLocationsOfRestaurants(req, res);
});

module.exports = app;
