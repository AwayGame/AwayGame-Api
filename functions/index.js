// Load initial modules
const functions = require("firebase-functions")
const express = require("express")
const app = express()
const cors = require('cors')

moment = require('moment')
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









app.get('/trip/:id', (req, res) => {
    TripHelper.getTrip(req.params.id).then(trip => {
        return res.send({
            status: 200,
            trip: trip
        })
    })
})

/**
 * Create a Trip and return it to the clint
 * @return {Object}  The Trip object
 */
app.post('/trip/createTrip', (req, res) => {
    axios.post(config.tripApiUrl + '/trip', req.body).then(response => {
        return res.send(response.data)
    }).catch(error => {
        console.log("error: ", error)
        return res.status(error.status).send({
            error: error.error
        })
    })
})

/**
 * Create a Trip and return it to the clint
 * @return {Object}  The Trip object
 */
app.post('/trip/save', (req, res) => {
    let trip = JSON.parse(req.body.trip)
    // Save the trip
    TripHelper.saveTrip(trip).then(tripResponse => {
        let tripStub = {
            id: tripResponse.id,
            title: "My Trip",
            startDate: "00asdasd",
            completed: false,
            imageUrl: "https://asdasd",
            createdAt: moment().toISOString(),
            deleted: false
        }

        UserHelper.addTripStub(tripStub, req.body.userId).then(response => {
            return res.sendStatus(200)
        }).catch(e => {
            console.log("error adding trip to user: ", e)
        })
    })
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