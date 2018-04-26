const functions = require("firebase-functions")
const express = require("express")
const app = express()
const cors = require('cors')
const Endpoints = require('./endpoints');
config = require('./config')
rp = require('request-promise')
admin = require('firebase-admin');

//Load helpers
const AlgoliaHelper = require('./helpers/algolia')
const TicketMasterHelper = require('./helpers/ticketMaster')

admin.initializeApp({
    credential: admin.credential.cert(config.appConfig),
    databaseURL: "https://awaygame-api.firebaseio.com"
});

db = admin.firestore();

app.use(cors({ origin: true }))


/**
 * Search Endpoints
 */

// Use Algolia search to find teams
app.get('/search/team/:term', (req, res) => {
	AlgoliaHelper.searchForTeams(req.params.term).then(results => {
		return res.send(results)
	})
});

// Search for games via TicketMaster Discovery API
app.post('/ticketmaster/searchForGames', (req, res) => {
	TicketMasterHelper.searchForGames(req.body).then(results => {
		return res.send(results)
	}).catch(error => {
		console.log("error: ", error)
		return res.status(error.status).send({
			error: error.error
		})
	})
})


const api = functions.https.onRequest(app)
module.exports = { api }