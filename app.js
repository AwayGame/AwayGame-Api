var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
rp = require('request-promise');
API = require('./api/index');

var users = require('./routes/users');

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

//define endpoints
app.get('/api/cities', function(req, res) {
    return API.Cities.getCities(req, res);
});

module.exports = app;
