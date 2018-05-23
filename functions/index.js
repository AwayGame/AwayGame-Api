// Load initial modules
const functions = require("firebase-functions")
const express = require("express")
const app = express()
const cors = require('cors')
config = require('./config')
rp = require('request-promise')
admin = require('firebase-admin');

// Load helpers
const AlgoliaHelper = require('./helpers/algolia')
const TicketMasterHelper = require('./helpers/ticketMaster')
const TripHelper = require('./helpers/trip')
const UserHelper = require('./helpers/user')

// Load Middleware
const Middleware = require('./middleware/index')

// Initialize the app and database
admin.initializeApp({
    credential: admin.credential.cert(config.appConfig),
    databaseURL: config.databaseURL
});
db = admin.firestore();

// Define what middleware we are using

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

/**
 * TicketMaster endpoints
 */

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

/**
 *
 *  User Endpoints
 *
 *  These endpoints deal with user data in the database including:
 *      1. Checking to see if a user exists
 *      2. Adding a user to the database
 *      3. Fetching a user from the database
 */

app.post('/user/verify', (req, res) => {
    UserHelper.verifyUser(req.body).then(user => {
        return res.send(user)
    }).catch(err => {
        return res.status(err.code).send(err.message)
    })
})


/**
 * Trip Endpoints
 */

app.post('/trip/createTrip', (req, res) => {
    TripHelper.createTrip(req.body).then(trip => {
        return res.send(trip)
    }).catch(error => {
        console.log("error: ", error)
        return res.status(error.status).send({
            error: error.error
        })
    })
})

const api = functions.https.onRequest(app)
module.exports = { api }