/**
 * Google Helper
 *
 * This helper uses the Google Places API to find locations for the user
 * to eat, visit, etc
 */

var helpers = require('./helpers')
var GoogleMapsClient = require('@google/maps').createClient({
    key: config.google.placesApiKey
});

module.exports = {
    /**
     * Finds businesses from Google. This process currently requires three
     * requests for the following activities:
     *  1. Food options
     *  2. "Day" activities
     *  3. "Night" activities
     * @param  {Object} Object with the user's preferences
     * @return {Array} An array of businesses, ready for sortings
     */
    findBusinesses: (data) => {
        return new Promise((resolve, reject) => {
            let queryObjects = [...getQueryData('food', data), ...getQueryData('day', data), ...getQueryData('night', data)]
            getBusinesses(queryObjects).then((businesses) => {
                return resolve(businesses)
            })
        })
    },
    getMoreDetails: (businesses) => {
        console.log("in Google. Getting more details for this many: ", businesses.length)
        return new Promise((resolve, reject) => {
            getBusinessesInMoreDetail(businesses).then(detailedBusinesses => {
                return resolve(detailedBusinesses)
            })
        })
    }
}


/**
 * 
 * Function definitions
 * 
 */

function getBusinesses(queryObjects) {
    let results = []
    let totalRequests = 0
    return new Promise((resolve, reject) => {
        queryObjects.forEach(queryObject => {
            getBusinessesFromGoogle(queryObject).then(response => {
                response.forEach(result => {
                    result.id = result.place_id
                    results.push(result)
                })

                totalRequests++
                if (totalRequests === queryObjects.length) {
                    results = helpers.removeDuplicates(results, 'name')
                    results = helpers.removeDuplicates(results, 'place_id')
                    results = helpers.addProvider(results, 'google')
                    return resolve(results)
                }
            })
        })
    })

    function getBusinessesFromGoogle(queryObject) {
        return new Promise((resolve, reject) => {
            let results = []

            makeRequests(queryObject, results)

            function makeRequests(googleRequestObject, results) {
                GoogleMapsClient.places(googleRequestObject.data, function(err, response) {
                    if (!err) {
                        response.json.results.forEach(business => {
                            business.category = googleRequestObject.category
                            business.subcategory = googleRequestObject.subcategory
                            results.push(business)
                        })

                        if (response.json.next_page_token) {
                            googleRequestObject.data.pagetoken = response.json.next_page_token
                            setTimeout(function() {
                                makeRequests(googleRequestObject, results)
                            }, 2500)
                        } else {
                            return resolve(results)
                        }
                    } else {
                        console.log("we got an error...: ", err)
                    }
                })
            }
        })
    }
}

function getQueryData(type, data) {
    let baseObject = {
        location: [data.lat, data.long],
        radius: helpers.milesToRadius(data.radius),
        language: 'en',
        opennow: true
    }

    switch (type) {
        case 'food':
            return formatFoodObject(baseObject)
            break;
        case 'day':
            return formatDayObject(baseObject)
            break;
        case 'night':
            return formatNightObject(baseObject)
            break;
    }

    function formatFoodObject(baseObject) {
        return data.preferences.food.map(preference => {
            let objToReturn = baseObject
            objToReturn.type = 'restaurant'
            objToReturn.query = config.google.foodCategories[preference]

            return {
                data: objToReturn,
                category: 'food',
                subcategory: preference
            }
        })
    }

    function formatDayObject(baseObject) {
        return data.preferences.dayActivities.map(preference => {
            let objToReturn = baseObject
            objToReturn.query = config.google.dayActivities[preference]
            return {
                data: objToReturn,
                category: 'day',
                subcategory: preference
            }
        })

    }

    function formatNightObject(baseObject) {
        return data.preferences.nightActivities.map(preference => {
            let objToReturn = baseObject
            objToReturn.query = config.google.nightActivities[preference]
            return {
                data: objToReturn,
                category: 'night',
                subcategory: preference
            }
        })
    }
}

function getBusinessesInMoreDetail(businesses) {
    return new Promise((resolve, reject) => {
        let detailedResults = []
        businesses.forEach(business => {
            let url = config.google.getBusinessInMoreDetailUrl
            url += 'placeid=' + business.place_id + '&key=' + config.google.placesApiKey

            rp({
                method: "GET",
                uri: url,
                json: true
            }).then(function(response) {
                if (response.result) {
                    response.result.category = business.category
                    response.result.subcategory = business.subcategory

                    let detailedBusiness = formatBusinessResult(response.result)
                    detailedResults.push(detailedBusiness)

                    //Check to see if we're done
                    if (detailedResults.length === businesses.length) {
                        return resolve(detailedResults)
                    }
                } else {
                    //handle error here...
                    console.log("error: ", response)
                }
            })
        })
    })

    /**
     * Formats the detailed result from the Google Places API
     * @param  {Object} The business returned
     * @return {Object} The formatted data from said business
     */
    function formatBusinessResult(business) {
        return {
            name: business.name,
            placeId: business.place_id,
            phone: business.formatted_phone_number,
            address: business.formatted_address,
            location: getLocation(business),
            website: business.website,
            hours: getHours(business),
            reviews: business.reviews,
            photos: getPhotoIds(business),
            price: business.price_level,
            rating: business.rating,
            category: business.category,
            subcategory: business.subcategory
        }

        /**
         * Gets latitude and longitude of business
         * @param  {Object} The business
         * @return {Object} Lat and long
         */
        function getLocation(business) {
            return {
                lat: business.geometry.location.lat,
                long: business.geometry.location.lng,
                mapsUrl: formatMapsUrl(business.geometry.location.lat, business.geometry.location.lng)
            }

            function formatMapsUrl(lat, lng) {
                let latLngStr = lat + "," + lng
                return "https://maps.googleapis.com/maps/api/staticmap?center=" + latLngStr + "&markers=color:0x82CA75|" + latLngStr + "&zoom=15&size=300x150&scale=2&key=" + config.google.mapStaticApiKey
            }
        }

        /**
         * Gets hours for the business
         * @param  {Object} The business
         * @return {Object} hours
         */
        function getHours(business) {
            if (!business.opening_hours) return {}

            return {
                formattedHours: business.opening_hours.weekday_text,
                individualDaysData: business.opening_hours.periods
            }
        }

        /**
         * Gets ids of photos that can be pulled from the client
         * @param  {Object} The business
         * @return {Array}  Array of photo IDs
         */
        function getPhotoIds(business) {
            if (!business.photos) return []
            return business.photos.map(photo => {
                return photo.photo_reference
            })
        }
    }
}