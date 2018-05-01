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
            let categories = []
            // Get a list of businesses that we can filter and sort
            // through before getting more details
            getListOfBusinessesFromProviders(data).then(businessData => {
                let initialListOfBusinesses = [...businessData[0]]

                //get three activity arrays - food, day, and night
                let foodChoices = []
                let dayActivities = []
                let nightActivities = []

                initialListOfBusinesses.forEach(result => {
                    if (result.type === 'food') {
                        foodChoices.push(result)
                    } else if (result.type === 'day') {
                        dayActivities.push(result)
                    } else if (result.type === 'night') {
                        nightActivities.push(result)
                    }
                })

                /*
                    Now we need to reduce this array down to only options that we need
                    Example:
                        1. If the user will be in a city for 3 days, we don't need to get
                        details for 5+ locations
                 */

                // This is the total number of options that the user selected
                let totalUserOptions = 0
                totalUserOptions += data.preferences.food.length
                totalUserOptions += data.preferences.dayActivities.length
                totalUserOptions += data.preferences.nightActivities.length

                //remove any businesses that don't meet our criteria (aka need data)
                initialListOfBusinesses.forEach(function(business, index) {
                    if(!business.opening_hours) initialListOfBusinesses.splice(index, 1)
                })

                //Sort the businesses by rating, then get more details
                initialListOfBusinesses = initialListOfBusinesses.sort(function(a, b) {
                    return b.rating - a.rating
                });

                // Now that we have sorted and filtered the
                // businesses, we can get more details, and return them

                let finalInitialListOfBusinesses = initialListOfBusinesses.slice(0, totalUserOptions)
                //return resolve(finalInitialListOfBusinesses)
                getMoreDetails(finalInitialListOfBusinesses).then(finalBusinessData => {
                    let finalBusinesses = [...finalBusinessData[0]]
                    return resolve(finalBusinesses)
                })
            })
        })


        /**
         * Finds businesses from our providers - this function is 
         * a stub that call all of our helpers
         */
        function getListOfBusinessesFromProviders(data) {
            return new Promise((resolve, reject) => {
                Promise.all([GoogleHelper.findBusinesses(data)]).then(businesses => {
                    return resolve(businesses)
                })
            })
        }

        function getMoreDetails(businesses) {
            return new Promise((resolve, reject) => {
                Promise.all([GoogleHelper.getMoreDetails(businesses)]).then(businesses => {
                    return resolve(businesses)
                })
            })
        }
    }
}