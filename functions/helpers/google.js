/**
 * Google Helper
 *
 * This helper uses the Google Places API to find locations for the user
 * to eat, visit, etc
 */

var helpers = require('./helpers')
var googleMapsClient = require('@google/maps').createClient({
    key: config.google.placesApiKey
});

/*
Use this eventually
 
googleMaps.places({
  query: 'fast food',
  language: 'en',
  location: [-33.865, 151.038],
  radius: 5000,
  minprice: 1,
  maxprice: 4,
  opennow: true,
  type: 'restaurant'
})
.asPromise()
.then(function(response) {
  expect(response.json.results).toEqual(
      arrayContaining([
        objectContaining({
          name: stringMatching('McDonalds')
        })
      ]));
})

*/

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
            // Get the three URLS
            let urls = [...getBusinessUrls('food', data), ...getBusinessUrls('day', data), ...getBusinessUrls('night', data)]
            getBusinesses(urls).then((businesses) => {
                return resolve(businesses)
            })
        })
    },
    getMoreDetails: (businesses) => {
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



function getBusinesses(urls) {
    let results = []
    let totalRequests = 0
    return new Promise((resolve, reject) => {
        urls.forEach(urlObject => {
            rp({
                method: "GET",
                uri: urlObject.url,
                json: true
            }).then(function(response) {
                response.results.forEach(result => {
                    result.type = urlObject.type
                    results.push(result)
                })

                totalRequests++
                if (totalRequests === urls.length) {
                    //remove duplicates
                    results = removeDuplicates(results, 'place_id')
                    return resolve(results)
                }
            })
        })
    })

    function removeDuplicates(myArr, prop) {
        return myArr.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }
}

/**
 * Creates the initial search URL to activities, food, etc. for the user
 * @param  type {String} The type of url to get
 * @param  data {Object} The data passed in from the application
 * @return {String} The URL to make the request to
 */
function getBusinessUrls(type, data) {
    // Set up base URL
    let baseUrl = setUpUrl(data)

    switch (type) {
        case 'food':
            return handleFoodUrls(baseUrl)
            break;
        case 'day':
            return handleDayActivites(baseUrl)
            break;
        case 'night':
            return handleNightActivites(baseUrl)
            break;
    }

    function handleFoodUrls(baseUrl) {
        return data.preferences.food.map(preference => {
            let url = baseUrl
            url += '&type=restaurant&keyword=' + config.google.foodCategories[preference]
            return {
                url: url,
                type: 'food'
            }
        })
    }

    function handleDayActivites(baseUrl) {
        return data.preferences.dayActivities.map(preference => {
            let url = baseUrl
            url += '&keyword=' + config.google.dayActivities[preference]
            return {
                url: url,
                type: 'day'
            }
        })

    }

    function handleNightActivites(baseUrl) {
        return data.preferences.nightActivities.map(preference => {
            let url = baseUrl
            url += '&keyword=' + config.google.nightActivities[preference]
            return {
                url: url,
                type: 'night'
            }
        })
    }

    function setUpUrl(data) {
        let url = config.google.findNearbyBusinessesUrl;
        // Add stadium location
        url += 'location=' + data.lat + ',' + data.long
        // Add radius from stadium
        url += '&radius=' + helpers.milesToRadius(data.radius)
        // Add API key
        url += '&key=' + config.google.placesApiKey
        return url
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