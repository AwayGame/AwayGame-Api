const functions = require("firebase-functions")
const express = require("express")
const app = express()
const cors = require('cors')
config = require('./config')
rp = require('request-promise')
admin = require('firebase-admin');

//Load helpers
const AlgoliaHelper = require('./helpers/algolia')
const TicketMasterHelper = require('./helpers/ticketMaster')
const ItineraryHelper = require('./helpers/itinerary')

admin.initializeApp({
    credential: admin.credential.cert(config.appConfig),
    databaseURL: "https://awaygame-api.firebaseio.com"
});

db = admin.firestore();

app.use(cors({ origin: true }))


/*
Get teams when needed
 
app.get('/test', (req, res) => {
	db.collection('teams')
	.get()
	.then(snapshot => {
		let teams = []
		snapshot.forEach(function(team) {
			teams.push(team.data())
		})
		return res.send(teams)
	})
})

*/


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

// Creates user's itinerary
app.post('/createItinerary', (req, res) => {
	ItineraryHelper.createItinerary(req.body).then(results => {
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