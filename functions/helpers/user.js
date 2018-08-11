const _ = require('underscore')

module.exports = {
    verifyUser: (data) => {
        return new Promise((resolve, reject) => {
            console.log("FETCHING USER WITH THIS ID: ", data.uid)
            getUser(data.uid).then(userData => {
                if (!userData) {
                    console.log("creating new user...")
                    createNewUser(data).then(newUser => {
                        console.log("user has been created. Now fetching")
                        console.log("here it is: ", newUser)
                        getUser(data.uid).then(userData => {
                            return resolve(userData)
                        })
                    })
                } else {
                    console.log("user was already in db. Returning")
                    return resolve(userData)
                }
            })
        })
    },
    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            console.log("deleting user with this id: ", id)

            admin.auth().deleteUser(id).then(function() {
                // delete data
                db.collection('user').doc(id).delete()
                    console.log("Successfully deleted user");
                    return resolve(200)
                })
                .catch(function(error) {
                    console.log("Error deleting user:", error);
                    return resolve(200)
                });

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
                if(!user.data()) return resolve(null)
                
                // sort tripStubs
                let dataToReturn = Object.assign({}, user.data())

                if (!dataToReturn.tripStubs) {
                    dataToReturn.tripStubs = []
                }

                dataToReturn.tripStubs = dataToReturn.tripStubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                return resolve(dataToReturn)
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