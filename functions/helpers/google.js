/**
 * googleMaps.places({
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
            getBusinessesFromGoogle(urlObject).then(response => {
                response.forEach(result => {
                    results.push(result)
                })

                totalRequests++
                if (totalRequests === urls.length) {
                    //remove duplicates
                    results = removeDuplicates(results, 'place_id')

                    for (var i = 0; i < results.length; i++) {
                        // Remove businesses with not enough data
                        if (!results[i].opening_hours || !results[i].place_id || !results[i].price) results.splice(i, 1)
                    }

                    return resolve(results)
                }
            })
        })
    })

    function getBusinessesFromGoogle(obj) {
        return new Promise((resolve, reject) => {
            let results = []

            makeRequests(obj, results)

            function makeRequests(urlObject, results) {
                rp({
                    method: "GET",
                    uri: urlObject.url,
                    json: true
                }).then(function(response) {
                    response.results.forEach(business => {
                        business.category = urlObject.category
                        business.subcategory = urlObject.subcategory
                        results.push(business)
                    })

                    if (response.next_page_token) {
                        urlObject.url = urlObject.url.split('&pagetoken=')[0] + '&pagetoken=' + response.next_page_token
                        setTimeout(function() {
                            makeRequests(urlObject, results)
                        }, 1500)
                    } else {
                        return resolve(results)
                    }
                })
            }
        })
    }

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
            return formatFoodUrlAndAddCategories(baseUrl)
            break;
        case 'day':
            return formatDayUrlAndAddCategories(baseUrl)
            break;
        case 'night':
            return handleNightUrlAndAddCategories(baseUrl)
            break;
    }

    function formatFoodUrlAndAddCategories(baseUrl) {
        return data.preferences.food.map(preference => {
            let url = baseUrl
            url += '&type=restaurant&keyword=' + config.google.foodCategories[preference]
            return {
                url: url,
                category: 'food',
                subcategory: preference
            }
        })
    }

    function formatDayUrlAndAddCategories(baseUrl) {
        return data.preferences.dayActivities.map(preference => {
            let url = baseUrl
            url += '&keyword=' + config.google.dayActivities[preference]
            return {
                url: url,
                category: 'day',
                subcategory: preference
            }
        })

    }

    function handleNightUrlAndAddCategories(baseUrl) {
        return data.preferences.nightActivities.map(preference => {
            let url = baseUrl
            url += '&keyword=' + config.google.nightActivities[preference]
            return {
                url: url,
                category: 'night',
                subcategory: preference
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
                mapsUrl: business.url
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