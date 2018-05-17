module.exports = {
    getUserById: (id) => {
        return new Promise((resolve, reject) => {
            db.collection('user').doc(id)
            .get()
            .then(user => {
                if(!user.data()) return reject({
                    status: 401,
                    message: 'User not found with id "' + id + '"'
                })

                getTripData(user.data().tripIds).then(trips => {
                    let userData = {}
                    Object.keys(user.data()).forEach(key => {
                        userData[key] = user.data()[key]
                    })
                    
                    userData.trips = trips
                    return resolve(userData)
                })


                function getTripData(ids) {
                    return new Promise((resolve, reject) => {
                        let fullTrips = []
                        for(var i = 0; i < ids.length; i++){
                            db.collection('trip').doc(ids[i])
                            .get()
                            .then(trip => {
                                fullTrips.push(trip.data())
                                if(fullTrips.length === ids.length) return resolve(fullTrips)
                            })
                        }
                    })
                }
            })
        })
    }
}