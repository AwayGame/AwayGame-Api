//https://www.yelp.com/developers/documentation/v3/business_search
//

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
rp = require('request-promise');
config = require('./config');
API = require('./api/index');

var users = require('./routes/users');

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

//define endpoints
//cities
app.get('/api/cities', function(req, res) {
    return API.Cities.getCities(req, res);
});

//business
app.get('/api/businesses', function(req, res) {
    return API.Business.getBusinesses(req, res);
});

module.exports = app;
