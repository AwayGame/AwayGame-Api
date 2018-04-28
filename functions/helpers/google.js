/**
 * Google Helper
 *
 * This helper uses the Google Places API to find locations for the user
 * to eat, visit, etc
 */

var helpers = require('./helpers')

module.exports = {
    findBusinesses: (data) => {
        return new Promise((resolve, reject) => {
            let url = getBusinessesUrl(data)
            getBusinesses(url).then((businesses) => {
                return resolve(businesses)
            })
        })
    }
}


/**
 * Function definitions
 */

function getBusinesses(url) {
    return new Promise((resolve, reject) => {
        getInitialList(url).then(initialListOfBusinesses => {
            getBusinessesInMoreDetail(initialListOfBusinesses).then(detailedBusinesses => {
                return resolve(detailedBusinesses)
            })
        })
    })
}

/**
 * Creates the initial search URL to activities, food, etc. for the user
 * @param  {Object} The data passed in from the application
 * @return {String} The URL to make the request to
 */
function getBusinessesUrl(data) {
    let url = config.google.findNearbyBusinessesUrl
    //Add location of stadium user is going to
    addStadiumLocation()
    // Add distance from stadium
    addDistanceFromStadium()
    //Add food and drinks
    addFoodAndDrinks()
    //Add activites user is going to want to do
    //addActivities()
    //Finally, add the API key
    addApiKey()
    return url

    function addStadiumLocation() {
        url += 'location=' + data.lat + ',' + data.long
    }

    function addDistanceFromStadium() {
        url += '&radius=' + helpers.milesToRadius(data.radius)
    }

    function addFoodAndDrinks() {
        //@todo
        url += '&type=restaurant&keyword=pizza'
    }

    function addApiKey() {
        url += '&key=' + config.google.placesApiKey
    }
}


function getInitialList(url) {
    return new Promise((resolve, reject) => {
        rp({
            method: "GET",
            uri: url,
            json: true
        }).then(function(response) {
            return resolve(response.results)
        })
    })
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
                    let detailedBusiness = formatBusinessResult(response.result)
                    detailedResults.push(detailedBusiness)
                    //Check to see if we're done
                    if (detailedResults.length === businesses.length) {
                        return resolve(detailedResults)
                    }
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
            phone: business.formatted_phone_number,
            address: business.formatted_address,
            location: getLocation(business),
            website: business.website,
            hours: getHours(business),
            reviews: business.reviews,
            photos: getPhotoIds(business),
            price: business.price_level,
            rating: business.rating
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
                mapsUrl: business.url
            }
        }

        /**
         * Gets hours for the business
         * @param  {Object} The business
         * @return {Object} hours
         */
        function getHours(business) {
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
            return business.photos.map(photo => {
                return photo.photo_reference
            })
        }
    }
}