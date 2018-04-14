const functions = require("firebase-functions")
admin = require('firebase-admin');
const express = require("express")
const app = express()
const cors = require('cors')
config = require('./config')
const Endpoints = require('./endpoints');
helpers = require('./helpers')
rp = require('request-promise')

admin.initializeApp({
    credential: admin.credential.cert(config.appConfig),
    databaseURL: "https://awaygame-api.firebaseio.com"
});

db = admin.firestore();
app.use(cors({ origin: true }))

app.get('/cities', (req, res) => {
	console.log("got here about to return the citie")
    return Endpoints.getCities(req, res);
});

app.get('/getTeamsFromCity/:cityId', (req, res) => {
	return Endpoints.getTeamsFromCity(req, res);
})

app.post('/getEvents', (req, res) => {
	return Endpoints.searchTicketMasterForEvents(req, res);
})

app.post('/getLocationsOfRestaurants', (req, res) => {
    return Endpoints.getLocationsOfRestaurants(req, res);
});

const api = functions.https.onRequest(app)
module.exports = { api }