const UserHelper = require('./user')

module.exports = {
    saveTrip: (data) => {
        return new Promise((resolve, reject) => {
            let trip = JSON.parse(data.trip)

            db.collection('trip')
                .add(trip)
                .then(tripResponse => {
                    let tripStub = {
                        id: tripResponse.id,
                        title: "My Trip",
                        startDate: "00asdasd",
                        completed: false,
                        imageUrl: "https://asdasd",
                        createdAt: moment().toISOString(),
                        deleted: false
                    }

                    UserHelper.addTripStub(tripStub, data.userId).then(response => {
                        return resolve(tripResponse)
                    }).catch(e => {
                        console.log("error adding trip to user: ", e)
                    })
                })
                .catch(error => {
                    console.log("error saving trip: ", error)
                    return reject(error)
                })
        })
    },
    deleteTrip: (tripId) => {
        return new Promise((resolve, reject) => {
            db.collection('trip')
                .doc(tripId)
                .delete()
                .then(deleted => {
                    return resolve(deleted)
                })
                .catch(error => {
                    console.log("error deleting trip trip: ", error)
                    return reject(error)
                })
        })
    },
    getTrip: (tripId) => {
        return new Promise((resolve, reject) => {
            db.collection('trip')
                .doc(tripId)
                .get()
                .then(trip => {
                    return resolve(trip.data())
                })
                .catch(error => {
                    console.log("error fetching trip: ", error)
                    return reject(error)
                })
        })
    },
    updateTrip: (data) => {
        return new Promise((resolve, reject) => {
            data.trip = '{"asd":"as"}'
            let trip = JSON.parse(data.trip)

            db.collection('trip')
                .doc(data.id)
                .set(trip)
                .then(tripResponse => {
                    console.log("trip with id " + data.id + " has been udpated.")
                    return resolve(tripResponse)
                })
                .catch(error => {
                    console.log("error saving trip: ", error)
                    return reject(error)
                })
        })
    }
}