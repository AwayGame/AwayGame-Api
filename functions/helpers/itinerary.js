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

const DAILY_PREFERENCE_COUNT = {
    'food': 3,
    'day': 2,
    'night': 1
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
                let initialListOfBusinesses = []
                businessData.forEach(business => initialListOfBusinesses.push(...business))

                let arrivalTime = moment(data.arrivalTime);
                let departureTime = moment(data.departureTime);
                // Todo: change to hours
                let tripLengthInHours = departureTime.diff(arrivalTime, 'hours')
                let tripLengthInDays = departureTime.diff(arrivalTime, 'days')

                console.log("User is going for " + tripLengthInDays + " days(s)")

                // Filter our choices down based on user preference with multiple options
                getListOfFinalBusinessesForUser(tripLengthInDays, initialListOfBusinesses).then(finalChoices => {
                    console.log("finalChoices length: ", finalChoices.length)
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
                console.log("Creating itinerary...")
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
                    removeBusinesses(day['breakfast'])
                    day['morningActivity'] = getBusinessOpenAtAvailableTime('day', businesses, date.day(), 'morningActivity')
                    removeBusinesses(day['morningActivity'])
                    day['lunch'] = getBusinessOpenAtAvailableTime('food', businesses, date.day(), 'lunch')
                    removeBusinesses(day['lunch'])
                    day['afternoonActivity'] = getBusinessOpenAtAvailableTime('day', businesses, date.day(), 'afternoonActivity')
                    removeBusinesses(day['afternoonActivity'])
                    day['dinner'] = getBusinessOpenAtAvailableTime('food', businesses, date.day(), 'dinner')
                    removeBusinesses(day['dinner'])
                    day['eveningActivity'] = getBusinessOpenAtAvailableTime('night', businesses, date.day(), 'eveningActivity')
                    removeBusinesses(day['eveningActivity'])

                    return day

                    function removeBusinesses(businessToCheck) {
                        businesses.forEach((business, index) => {
                            if (business.placeId === businessToCheck.placeId || business.name === businessToCheck.name) {
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
                        for (var i = 0; i < businesses.length; i++) {
                            let business = businesses[i]
                            if (business.hours.individualDaysData) {
                                for (var j = 0; j < business.hours.individualDaysData.length; j++) {
                                    let businessDay = business.hours.individualDaysData[j]
                                    // If the business matches the category we are looking for and it opens before our starting time, then add it
                                    if (business.category === category && businessDay.open.day === day && businessIsOpenOnTime(businessDay, TIMES[time])) {
                                        return business
                                    }
                                }
                            }
                        }

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
         * This function takes the results that we initially got and sorts/filters them
         * for the user. The sorting can be by price, distance to the user, rating, etc.
         *
         * Once we have sorted and chosen the businesses and their backups for the user, we will
         * return this array and get more details for these businesses
         *
         * @param  {Int}        numberOfDaysInTrip         The number of days in the user's trip
         * @param  {Array}      businesses                 The businesses that we are looking through
         * @return {Array}      finalChoices               The final set of activities, food, etc for the user
         */
        function getListOfFinalBusinessesForUser(numberOfDaysInTrip, businesses) {
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

                // For each day, get three options - one main, and two backups
                let finalBusinesses = []
            
                Object.keys(data).forEach(category => {
                    Object.keys(data[category]).forEach(subcategory => {
                        let start = 0
                        let end = (numberOfDaysInTrip * DAILY_PREFERENCE_COUNT[category] * 3)
                        
                        if(data[category][subcategory].length <= end) {
                            finalBusinesses = finalBusinesses.concat(data[category][subcategory])
                        } else {
                            finalBusinesses = finalBusinesses.concat(data[category][subcategory].slice(start, end))
                        }
                    })
                })

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