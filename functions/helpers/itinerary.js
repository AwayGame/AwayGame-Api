var helpers = require('./helpers')
var GoogleHelper = require('./google')

module.exports = {
    /**
     * Creates the user's itinerary by reaching out to our partners
     * and finding activities, travel options, bookings, etc
     * @param  {Object} The data passed up from the client
     * @return {Object} The user's itinerary
     */
    createItinerary: (data) => {
        return new Promise((resolve, reject) => {
            //currently only using Google Places
            getListOfBusinessesFromProviders().then(businesses => {
                let googleBusinesses = businesses[0]
                console.log("got businesses!!!!")
                //sort the results
                //sort()...
                return resolve(googleBusinesses)
            })
        })


        /**
         * Finds businesses from our providers - this function is 
         * a stub that call all of our helpers
         */
        function getListOfBusinessesFromProviders() {
            return new Promise((resolve, reject) => {
                Promise.all([GoogleHelper.findBusinesses(data)]).then(businesses => {
                    return resolve(businesses)
                })
            })
        }
    }
}