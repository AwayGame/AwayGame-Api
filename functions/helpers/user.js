module.exports = {
    verifyUser: (data) => {
        return new Promise((resolve, reject) => {
            getUser(data.uid).then(userData => {
                if (!userData) {
                    createNewUser(data).then(newUser => {
                        getUser(data.uid).then(userData => {
                            return resolve(userData)
                        })
                    })
                } else {
                    return resolve(userData)
                }
            })
        })
    },
    addTripStub: (stub, id) => {
        return new Promise((resolve, reject) => {
            getUser(id).then(user => {
                if (!user.tripStubs) {
                    user.tripStubs = []
                }

                user.tripStubs.push(stub)
                updateUser(id, user).then(updateUserResponse => {
                    return resolve(updateUserResponse)
                })
            })
        })
    },
    deleteTripStub: (stubId, userId) => {
        return new Promise((resolve, reject) => {
            getUser(userId).then(user => {
                let trip = _.findWhere(user.tripStubs, {
                    id: stubId
                })
                trip.deleted = true;

                updateUser(userId, user).then(updateUserResponse => {
                    return resolve(updateUserResponse)
                })
            })
        })
    }
}


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
 * Creates a new user if the user was not found in the database
 * @param  {Object} data The user data to save
 * @return {Object}      The new user
 */
function createNewUser(data) {
    return new Promise((resolve, reject) => {
        data.tripStubs = []
        data.settings = {}
        db.collection('user').doc(data.uid)
            .set(data)
            .then(user => {
                return resolve(user)
            })
    })
}

function updateUser(id, data) {
    return new Promise((resolve, reject) => {
        db.collection('user').doc(id)
            .set(data)
            .then(user => {
                return resolve(user)
            })
    })
}