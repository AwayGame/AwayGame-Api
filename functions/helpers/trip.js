const helpers = require('./helpers')
const GoogleHelper = require('./google')
const YelpHelper = require('./yelp')
const moment = require('moment')
const _ = require('underscore')

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
    'dayActivities': 2,
    'nightActivities': 1
}

const ACTIVITIES = [{
        subactivity: 'breakfast',
        activity: 'food'
    }, {
        subactivity: 'morningActivity',
        activity: 'day'
    }, {
        subactivity: 'lunch',
        activity: 'food'
    }, {
        subactivity: 'afternoonActivity',
        activity: 'day'
    },
    {
        subactivity: 'dinner',
        activity: 'food'
    }, {
        subactivity: 'eveningActivity',
        activity: 'night'
    }
]

module.exports = {
    /**
     * Creates the user's trip by reaching out to our partners
     * and finding activities, travel options, bookings, etc
     * @param  {Object} The data passed up from the client
     * @return {Object} The user's trip
     */
    createTrip: (data) => {
        return new Promise((resolve, reject) => {
            let arrivalDate = moment(data.arrivalTime);
            let departureDate = moment(data.departureTime);
            let tripLengthInHours = departureDate.diff(arrivalDate, 'hours')
            let totalDays = departureDate.diff(arrivalDate, 'days')
            let remainingHours = tripLengthInHours - (24 * totalDays)
            let formattedTripDates = []
            console.log("trip length is " + totalDays + " day(s) and " + remainingHours + " hour(s)")


            while (arrivalDate.isBefore(departureDate)) {
                formattedTripDates.push(new moment(arrivalDate.format()))
                arrivalDate.add(1, 'days');
            }

            let categories = []
            // Get a list of businesses that we can filter and sort
            // through before getting more details
            getListOfBusinessesFromProviders(data).then(businessData => {
                let initialListOfBusinesses = []

                for (var i = 0; i < businessData.length; i++) {
                    initialListOfBusinesses.push(...businessData[i])
                }

                console.log("this many total: ", initialListOfBusinesses.length)
                // Remove duplicates
                console.log("removing duplicates by id in trip js...")
                initialListOfBusinesses = helpers.removeDuplicates(initialListOfBusinesses, 'id')
                console.log("this many total: ", initialListOfBusinesses.length)
                console.log("removing duplicates by name...")
                initialListOfBusinesses = helpers.removeDuplicates(initialListOfBusinesses, 'name')
                console.log("this many total: ", initialListOfBusinesses.length)
                // Sort by user preferences
                initialListOfBusinesses = sortByUserPreferenceAndRemoveBusinessesWithoutRequiredParameters(initialListOfBusinesses, data.preferences)
                // Filter our choices down based on user preference with multiple options
                getListOfFinalBusinessesForUser(formattedTripDates.length, initialListOfBusinesses).then(finalChoices => {
                    // Get more details for the user's businesses before we format the trip
                    console.log("Getting details for this many: ", finalChoices.length)
                    getMoreDetails(finalChoices).then(finalBusinessData => {
                        let finalBusinesses = []
                        for (var i = 0; i < finalBusinessData.length; i++) {
                            finalBusinesses.push(...finalBusinessData[i])
                        }

                        formatTripFromBusinesses(formattedTripDates, finalBusinesses).then(trip => {
                            return resolve(trip)
                        })
                    })
                })
            })
        })

        /**
         * This function creates the trip response object for the front end
         * @param  {Array}          tripLengthInDays        THe days the user is going on their trip
         * @param  {Array}          businesses              The businesses and activities to use
         * @return {Object}         trip                    The user's trip
         */
        function formatTripFromBusinesses(tripLengthInDays, businesses) {
            return new Promise((resolve, reject) => {
                console.log("Creating trip...")
                // Format the businesses into an trip for the user
                // Each key is a day in the user's trip, with the times
                // listed out as keys as well

                let trip = {}

                for (var i = 0; i < tripLengthInDays.length; i++) {
                    trip[tripLengthInDays[i].format()] = getActivitiesAndBackupsForTheDay(businesses, tripLengthInDays[i])
                }

                console.log("done!")
                console.log("returning the trip")

                return resolve(trip)

                /**
                 * Formats a "day" object for the trip
                 * @return {Object} A full day of activities
                 */
                function getActivitiesAndBackupsForTheDay(businesses, date) {
                    let day = {}

                    ACTIVITIES.forEach(activity => {
                        day[activity.subactivity] = getBusinessAndBackupOpenAtAvailableTime(activity.activity, businesses, date.day(), activity.subactivity)
                    })

                    console.log("about to return the day")

                    return day


                    /**
                     * Determines if a business is open and in an available time for the user
                     * @param  {Object}     The business we are comparing
                     * @param  {Int}        The day (0 - 6) that we need the business to be open on
                     * @param  {Int}.       The time as an int that the business has to be open at
                     * @return {Boolean}    True/False if it is open
                     */
                    function getBusinessAndBackupOpenAtAvailableTime(category, businesses, day, time) {
                        let foundBusinesses = []

                        for (var i = 0; i < businesses.length; i++) {
                            let business = businesses[i]
                            for (var j = 0; j < business.hours.individualDaysData.length; j++) {
                                let businessDay = business.hours.individualDaysData[j]
                                if (validBusiness(foundBusinesses, business, category, businesses, businessDay, day, time)) {
                                    foundBusinesses.push(business)
                                    console.log("added one...")
                                    if (foundBusinesses.length === 3) {
                                        let finalBusiness = foundBusinesses[0]
                                        finalBusiness.backups = [foundBusinesses[1], foundBusinesses[2]]
                                        return finalBusiness
                                    }
                                }
                            }
                        }


                        function validBusiness(foundBusinesses, business, category, businesses, businessDay, day, time) {
                            return (_.findWhere(foundBusinesses, business) == null && business.category === category && businessDay.open.day === day && businessIsOpenOnTime(business, TIMES[time]))
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
                // Create an object with each category and subcategory, so that
                // we can get the best options for the user
                let data = {}

                for (var i = 0; i < businesses.length; i++) {
                    let business = businesses[i]
                    if (!data[business.category]) {
                        data[business.category] = {}
                    }

                    if (!data[business.category][business.subcategory]) {
                        data[business.category][business.subcategory] = []
                    }

                    data[business.category][business.subcategory].push(business)
                }

                // For each day, get three options - one main, and two backups
                let finalBusinesses = []

                // for each category
                for (var i = 0; i < Object.keys(data).length; i++) {
                    let category = Object.keys(data)[i]
                    // for each subcategory
                    for (var j = 0; j < Object.keys(data[category]).length; j++) {
                        let subcategory = Object.keys(data[category])[j]
                        let start = 0
                        let end = (numberOfDaysInTrip * DAILY_PREFERENCE_COUNT[category] * 3)

                        if (data[category][subcategory].length <= end) {
                            finalBusinesses = finalBusinesses.concat(data[category][subcategory])
                        } else {
                            finalBusinesses = finalBusinesses.concat(data[category][subcategory].slice(start, end))
                        }
                    }

                }

                resolve(finalBusinesses)
            })
        }
    }
}


/**
 * Finds businesses from our providers - this function is 
 * a stub that call all of our helpers
 */
function getListOfBusinessesFromProviders(data) {
    return new Promise((resolve, reject) => {
        let listOfCalls = []
        Promise.all([
            //GoogleHelper.findBusinesses(data),
            YelpHelper.findBusinesses(data)
        ]).then(businesses => {
            return resolve(businesses)
        })
    })
}

function getMoreDetails(businesses) {
    let data = {}
    for (var i = 0; i < businesses.length; i++) {
        if (!data[businesses[i].provider]) {
            data[businesses[i].provider] = []
        }
        data[businesses[i].provider].push(businesses[i])
    }

    return new Promise((resolve, reject) => {
        Promise.all([
            //GoogleHelper.getMoreDetails(data['google']),
            YelpHelper.getMoreDetails(data['yelp'])
        ]).then(businesses => {
            return resolve(businesses)
        })
    })
}

/**
 * Sorts by the user's preferences
 * @param  {Array}  businesses          The businesses to sort
 * @param  {Object} preferences         The user's preferences that they entered in the app
 * @return {Array}                      The sorted businesses
 */
function sortByUserPreferenceAndRemoveBusinessesWithoutRequiredParameters(businesses, preferences) {
    // For now, just sort by rating...
    businesses = businesses.sort(function(a, b) {
        return b.rating - a.rating
    });
    return businesses
}