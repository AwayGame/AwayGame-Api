// Load initial modules
const functions = require("firebase-functions")
const express = require("express")
const app = express()
const cors = require('cors')

moment = require('moment-timezone');
axios = require('axios')
config = require('./config')
_ = require('underscore')
rp = require('request-promise')
admin = require('firebase-admin');

// Load helpers
const TicketMasterHelper = require('./helpers/ticketMaster')
const UserHelper = require('./helpers/user')
const TripHelper = require('./helpers/trip')

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

// ENDPOINTS

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

app.delete('/user/:id', (req, res) => {
    UserHelper.deleteUser(req.params.id).then(resp => {
        return res.send(resp)
    }).catch(err => {
        return res.status(err.code).send(err.message)
    })
})


// Trip Endpoints

app.get('/trip/:id', (req, res) => {
    TripHelper.getTrip(req.params.id).then(trip => {
        return res.send(trip)
    })
})

/**
 * Create a Trip and return it to the clint
 * @return {Object}  The Trip object
 */
app.post('/trip/createTrip', (req, res) => {
    axios.post(config.tripApiUrl + '/trip', req.body).then(response => {
        saveTripRequestData(req.body.failed || null)
        return res.send(response.data)
    }).catch(error => {
        console.log("error: ", error)
        saveTripRequestData(true)
        return res.status(error.status).send({
            error: error.error
        })
    })

    function saveTripRequestData(failed = false) {
        let collection = (failed) ? 'failedTripRequestData' : 'tripRequestData'
        db.collection(collection).add(req.body)
    }
})

/**
 * Create a Trip and return it to the clint
 * @return {Object}  The Trip object
 */
app.post('/trip/save', (req, res) => {
    if(req.body.id) {
        TripHelper.updateTrip(req.body).then(updateResponse => {
            console.log("updateResponse: ", updateResponse)
            return res.sendStatus(200)
        })
    } else {
        TripHelper.saveTrip(req.body).then(response => {
            return res.sendStatus(200)
        })
    }
})

app.post('/trip/delete', (req, res) => {
    // Save the trip
    UserHelper.deleteTripStub(req.body.tripId, req.body.userId).then(response => {
        return res.sendStatus(200)
    }).catch(e => {
        console.log("error deleting trip trip to user: ", e)
    })
})

const api = functions.https.onRequest(app)
module.exports = { api }

/*
// Set into redis
RedisHelper.get('gamesToPoll').then(gamesToPoll => {
    if (!gamesToPoll.games) {

    } else {
        gamesToPoll.games.push({
            gameId: userData.gameId,
            userId: userData.userId,
            tripId:
        })
    }
})

 */