var helpers = require('./helpers')
var GoogleHelper = require('./google')
var moment = require('moment')

const TIMES = {
    'breakfast': 500,
    'morningActivity': 1000,
    'lunch': 1200,
    'afternoonActivity': 1400,
    'dinner': 1800,
    'eveningActivity': 2100
}

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
                        formatItineraryFromBusinesses(arrivalTime, departureTime, finalBusinesses).then(itinerary => {
                            return resolve(itinerary)
                        })
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
            return new Promise((resolve, reject) => {
                // Format the businesses into an itinerary for the user
                // Each key is a day in the user's trip, with the times
                // listed out as keys as well

                let itinerary = {}

                while (arrivalDate.isSameOrBefore(departureDate)) {
                    itinerary[arrivalDate.format()] = getActivitiesForTheDay(businesses, arrivalDate)
                    arrivalDate.add(1, 'days');
                }

                return resolve(itinerary)

                /**
                 * Formats a "day" object for the itinerary
                 * @return {Object} A full day of activities
                 */
                function getActivitiesForTheDay(businesses, date) {
                    let day = {}

                    day['breakfast'] = getBusinessOpenAtAvailableTime('food', businesses, date.day(), 'breakfast')
                    console.log("removing breakfast")
                    removeBusinesses(day['breakfast'].placeId)
                    day['morningActivity'] = getBusinessOpenAtAvailableTime('day', businesses, date.day(), 'morningActivity')
                    console.log("removing morningActivity")
                    removeBusinesses(day['morningActivity'].placeId)
                    day['lunch'] = getBusinessOpenAtAvailableTime('food', businesses, date.day(), 'lunch')
                    console.log("removing lunch")
                    removeBusinesses(day['lunch'].placeId)
                    day['afternoonActivity'] = getBusinessOpenAtAvailableTime('day', businesses, date.day(), 'afternoonActivity')
                    console.log("removing afternoonActivity")
                    removeBusinesses(day['afternoonActivity'].placeId)
                    day['dinner'] = getBusinessOpenAtAvailableTime('food', businesses, date.day(), 'dinner')
                    console.log("removing dinner")
                    removeBusinesses(day['dinner'].placeId)
                    day['eveningActivity'] = getBusinessOpenAtAvailableTime('night', businesses, date.day(), 'eveningActivity')
                    console.log("removing eveningActivity")
                    removeBusinesses(day['eveningActivity'].placeId)

                    function removeBusinesses(id) {
                        businesses.forEach((business, index) => {
                            if (business.placeId === id) {
                                businesses.splice(index, 1)
                            }
                        })
                    }

                    /**
                     * Determines if a business is open and in an available time for the user
                     * @param  {Object}     The business we are comparing
                     * @param  {Int}        The day (0 - 6) that we need the business to be open on
                     * @param  {Int}.       The time as an int that the business has to be open at
                     * @return {Boolean}    True/False if it is open
                     */
                    function getBusinessOpenAtAvailableTime(category, businesses, day, time) {
                        console.log("we have this many: ", businesses.length)
                        for (var i = 0; i < businesses.length; i++) {
                            let business = businesses[i]
                            if (business.hours.individualDaysData) {
                                for (var j = 0; j < business.hours.individualDaysData.length; j++) {
                                    let businessDay = business.hours.individualDaysData[j]
                                    // If the business matches the category we are looking for and it opens before our starting time, then add it
                                    if (business.category === category && businessDay.open.day === day && businessIsOpenOnTime(businessDay, TIMES[time])) {
                                        console.log("hey we got one that matches " + time + ": ", business.name)
                                        return business
                                    }
                                }
                            }
                        }

                        //if we got here something messed up
                        console.log("\n\nthis category is about to fail...", time)
                        console.log("here was the day: ", day)
                        console.log("category: ", category)

                        for (var i = 0; i < businesses.length; i++) {
                            let business = businesses[i]
                            if (business.hours.individualDaysData) {
                                console.log("it has individualDaysData")
                                console.log("category: ", business.category)
                                for (var j = 0; j < business.hours.individualDaysData.length; j++) {
                                    let businessDay = business.hours.individualDaysData[j]
                                    
                                    if(business.category === category && businessDay.open.day === day) {
                                        console.log("checkong today: ", businessDay)
                                        console.log("open?: ", businessIsOpenOnTime(businessDay, TIMES[time]))
                                    }

                                    // If the business matches the category we are looking for and it opens before our starting time, then add it
                                    if (business.category === category && businessDay.open.day === day && businessIsOpenOnTime(businessDay, TIMES[time])) {
                                        console.log("hey we got one that matches " + time + ": ", business.name)
                                        return business
                                    }
                                }
                            }
                        }

                        //late night

                        // {
                        //     close: { day: 5, time: '0300' },
                        //     open: { day: 4, time: '2200' }
                        // }

                        // {
                        //     close: { day: 3, time: '2100' },
                        //     open: { day: 3, time: '1000' }
                        // }

                        function businessIsOpenOnTime(businessDay, time) {
                            // If it's open, return true
                            if (parseInt(businessDay.open.time) <= time) return true
                            if (parseInt(businessDay.close.time) > time) return true
                            // If the business closes on a different day, this means it is open past midnight, which
                            // is before our cap
                            if (businessDay.close.day != businessDay.open.day) return true
                            return false
                        }
                    }
                }
            })
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
                            let start = (i === 0) ? 0 : (i * 5)
                            let end = (i === 0) ? 5 : (start + 5)
                            finalBusinesses = finalBusinesses.concat(data[category][subcategory].slice(0, 3))
                        })
                    })
                }

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