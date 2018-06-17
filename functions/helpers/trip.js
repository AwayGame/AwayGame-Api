module.exports = {
    saveTrip: (trip) => {
        return new Promise((resolve, reject) => {
            db.collection('trip')
                .add(trip)
                .then(tripResponse => {
                    return resolve(tripResponse)
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
    }
}