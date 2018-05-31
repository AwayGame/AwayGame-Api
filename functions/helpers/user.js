module.exports = {
    verifyUser: (data) => {
        return new Promise(function(resolve, reject) {
            getUser(data.uid).then(user => {
                if (!user) {
                    createNewUser(data).then(newUser => {
                        getUser(data.uid).then(finalUser => {
                            return resolve(finalUser)
                        })
                    })
                } else {
                    getTripData(user.tripIds).then(trips => {
                        user.trips = trips
                        return resolve(user)
                    })
                }
            })

            /**
             * Fetches a user by authorization ID
             * @param  {String} id          The Auth ID from Firebase
             * @return {Object || null}     The User object, or null if it does not exist
             */
            function getUser(id) {
                return new Promise((resolve, reject) => {
                    db.collection('user').doc(id)
                        .get()
                        .then(user => {
                            return resolve(user.data())
                        })
                })
            }

            /**
             * Fetches a user's trips and returns them back
             * @param  {Array} ids The objectIds of the trips to fetch
             * @return {Array}     The full Trip objects
             */
            function getTripData(ids) {
                return new Promise((resolve, reject) => {
                    if (!ids.length) return resolve([])
                    let fullTrips = []
                    for (var i = 0; i < ids.length; i++) {
                        db.collection('trip').doc(ids[i])
                            .get()
                            .then(trip => {
                                fullTrips.push(trip.data())
                                if (fullTrips.length === ids.length) return resolve(fullTrips)
                            })
                    }
                })
            }

            /**
             * Creates a new user if the user was not found in the database
             * @param  {Object} data The user data to save
             * @return {Object}      The new user
             */
            function createNewUser(data) {
                return new Promise((resolve, reject) => {
                    data.tripIds = []
                    data.settings = {}
                    db.collection('user').doc(data.uid)
                        .set(data)
                        .then(user => {
                            return resolve(user)
                        })
                })
            }
        })
    }
}