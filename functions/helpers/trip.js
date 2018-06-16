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
    }
}