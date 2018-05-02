var helpers = require('./helpers')
var GoogleHelper = require('./google')
var moment = require('moment')

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

                // This is the total number of options that the user selected
                let totalUserOptions = 0
                totalUserOptions += data.preferences.food.length
                totalUserOptions += data.preferences.dayActivities.length
                totalUserOptions += data.preferences.nightActivities.length


                let arrivalTime = moment(data.arrivalTime);
                let departureTime = moment(data.departureTime);
                // Todo: change to hours
                let tripLengthInHours = departureTime.diff(arrivalTime, 'hours')
                let tripLengthInDays = departureTime.diff(arrivalTime, 'days')

                console.log("User is going for " + tripLengthInDays + " days(s)")

                // Filter our choices down based on user preference with multiple options
                getTopPicksForUserCategories(tripLengthInDays, totalUserOptions, initialListOfBusinesses).then(finalChoices => {
                    console.log("final choices length is: ", finalChoices.length)

                    // Get more details for the user's businesses before we format the itinerary
                    getMoreDetails(finalChoices).then(finalBusinessData => {
                        console.log("got the details of the businesses")
                        let finalBusinesses = [...finalBusinessData[0]]
                        let itinerary = formatItineraryFromBusinesses(arrivalTime, departureTime, finalBusinesses)
                        return resolve(itinerary)
                    })
                })
            })
        })

        /**
         * This function creates the itinerary response object for the front end
         * @param  {MomentJS Date}  arrivalDate     The arrival time of the user
         * @param  {MomentJS Date}  departureDate   The departure time of the user
         * @param  {Array}          businesses      The businesses and activities to use
         * @return {Object}         itinerary       The user's itinerary
         */
        function formatItineraryFromBusinesses(arrivalDate, departureDate, businesses) {

            console.log("arrival date: ", arrivalDate)
            console.log("departure date: ", departureDate)
            console.dir("businessess: ", businesses)
            // Format the businesses into an itinerary for the user
            // Each key is a day in the user's trip, with the times
            // listed out as keys as well

            let itinerary = {}

            while (arrivalDate.isSameOrBefore(departureDate)) {
                itinerary[arrivalDate.format()] = getActivitiesForTheDay(arrivalDate)

                arrivalDate.add(1, 'days');
            }

            /**
             * Formats a "day" object for the itinerary
             * @return {Object} A full day of activities
             */
            function getActivitiesForTheDay(date) {
                let day = {}
                return day

                day = addBreakfast(day)
                day = addMorningActivity(day)
                day = addLunch(day)
                day = addAfternoonActivity(day)
                day = addDinner(day)
                day = addEveningActivity(day)

                return day

                // 9:00am
                function addBreakfast(day) {
                    day['breakfast']
                    return day
                }

                // 10:00am - 12:00pm
                function addMorningActivity(day) {

                    return day
                }

                // 12:00pm - 2:00pm
                function addLunch(day) {

                    return day
                }

                // 2:00pm - 5:00pm
                function addAfternoonActivity(day) {

                    return day
                }

                // 5:00 - 7:00pm
                function addDinner(day) {

                    return day
                }

                // 7:00pm - end
                function addEveningActivity(day) {

                    return day
                }
            }
        }

        /**
         * This endpoint takes the results that we initially got and sorts/filters them
         * for the user. The sorting can be by price, distance to the user, rating, etc.
         *
         * Once we have sorted and chosen the businesses and their backups for the user, we will
         * return this array and get more details for these businesses
         *
         * @param  {Int}   numberOfDaysInTrip         The number of days in the user's trip
         * @param  {Int}   numberOfCategoriesPicked   The number of options the user entered
         * @param  {Array} businesses                 The businesses that we are looking through
         * @return {Array} finalChoices               The final set of activities, food, etc for the user
         */
        function getTopPicksForUserCategories(numberOfDaysInTrip, numberOfCategoriesPicked, businesses) {
            return new Promise((resolve, reject) => {
                // Remove businesses with no hours posted
                businesses.forEach(function(business, index) {
                    if (!business.opening_hours || !business.place_id) businesses.splice(index, 1)
                })

                // Sort the businesses by rating, then get more details
                businesses = businesses.sort(function(a, b) {
                    return b.rating - a.rating
                });

                // Create an object with each category and subcategory, so that
                // we can get the best options for the user

                let data = {}
                businesses.forEach(business => {
                    if (!data[business.category]) {
                        data[business.category] = {}
                    }

                    if (!data[business.category][business.subcategory]) {
                        data[business.category][business.subcategory] = []
                    }

                    data[business.category][business.subcategory].push(business)
                })

                // Now we will pick one option for each category, for each day,
                // as well as two other "backup" options (for swipe)

                // For each day, get three options

                let finalBusinesses = []
                for (var i = 0; i < numberOfDaysInTrip; i++) {
                    Object.keys(data).forEach(category => {
                        Object.keys(data[category]).forEach(subcategory => {
                            let start = (i === 0) ? 0 : (i * 3)
                            let end = (i === 0) ? 3 : (start + 3)
                            finalBusinesses = finalBusinesses.concat(data[category][subcategory].slice(0, 3))
                        })
                    })
                }

                console.log("Got the top results plus 2 backups for a trip for " + numberOfDaysInTrip + " day(s)")
                console.log("number of final things to fetch: ", finalBusinesses.length)

                resolve(finalBusinesses)
            })
        }


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