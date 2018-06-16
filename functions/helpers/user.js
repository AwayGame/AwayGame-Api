module.exports = {
    verifyUser: (data) => {
        return new Promise(async function(resolve, reject) {
            let userData = await getUser(data.uid)

            if (!userData) {
                let newUser = await createNewUser(data)
                userData = await getUser(data.uid)
            }

            return resolve(userData)
        })
    },
    addTripStub: (stub, id) => {
        return new Promise(async(resolve, reject) => {
            let user = await getUser(id)
            
            if(!user.tripStubs){
                user.tripStubs = []
            }

            user.tripStubs.push(stub)
            let updateUserResponse = await updateUser(id, user)

            return resolve(updateUserResponse)
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