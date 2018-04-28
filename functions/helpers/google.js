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
    console.dir("getting businesses")
    return new Promise((resolve, reject) => {
        getInitialList(url).then(initialListOfBusinesses => {
            console.log("got the inital list getting detailed")
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
            console.log("here is the response: ", response)
            return resolve(response.results)
        })
    })
}

function getBusinessesInMoreDetail(businesses) {
    return new Promise((resolve, reject) => {
        console.log("getting more detail for " + businesses.length + " results")
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
                    //get photos, then format
                    getPhotos(response.result).then(photos => {
                        //update photos
                        response.result.photos = photos
                        let detailedBusiness = formatBusinessResult(response.result)
                        console.log("business formatted")
                        detailedResults.push(detailedBusiness)
                        //Check to see if we're done
                        if (detailedResults.length === businesses.length) {
                            return resolve(detailedResults)
                        }
                    })
                }
            })
        })
    })

    /**
     * Gets photos from the Google Places Photos API
     * @param  {Object} The business
     * @return {Array}  An array of photos
     */
    function getPhotos(business) {
        return new Promise((resolve, reject) => {
            let fullPhotos = []
            let photoIds = business.photos.forEach(photo => {
                let url = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=400&photoreference=" + photo.photo_reference + "&key=" + config.google.placesApiKey

                rp({
                    method: "GET",
                    uri: url,
                    json: true
                }).then(function(response) {
                    console.log("Photo response: ", response)
                    fullPhotos.push(response)
                    if (fullPhotos.length === business.photos.length) return resolve(fullPhotos)
                })
            })
        })
    }

    /**
     * Formats the detailed result from the Google Places API
     * @param  {Object} The business returned
     * @return {Object} The formatted data from said business
     */
    function formatBusinessResult(business) {
        return {
            name: business.name,
            phone: business.formatted_phone_number,
            address: getAddress(business),
            location: getLocation(business),
            website: business.website,
            hours: getHours(business),
            reviews: business.reviews,
            photos: business.photos,
            price: business.price_level,
            rating: business.rating
        }

        /**
         * Gets detailed address information and a formatted string
         * of the business
         * @param  {Object} The business
         * @return {Object} Address information for the business
         */
        function getAddress(business) {
            return businesses.formatted_address;

            // return {
            //     formattedAddress: business.formatted_address,
            //     streetNumbers: business.address_components[0],
            //     streetNames: business.address_components[1],
            //     city: business.address_components[3].long_name,
            //     state: business.address_components[5].long_name,
            //     stateAbbr: business.address_components[5].short_name,
            //     country: business.address_components[6].long_name,
            //     countryAbbr: business.address_components[6].short_name,
            //     postalCode: business.address_components[7].long_name,
            // }

            // let addressData = formatAddressData(businesse.address_components)
            // addressData.formattedAddress = business.formatted_address
            // return addressData

            // function formatAddressData(addressComponents) {
            //     let obj = {}
            //     addressComponents.forEach(component => {
            //         switch(component.types[0]) {
            //             case 'street_number':
            //                 obj.streetNumbers = component
            //                 break;
            //             case 'route':
            //                 obj.streetNames = component
            //                 break;
            //             case 'neighborhood':
            //                 obj.neighborhood = component
            //                 break;
            //             case 'locality':
            //                 obj.city = component.long_name
            //                 break;
            //             case 'country':
            //                 obj.country = component.long_name
            //                 obj.countryAbbr = component.short_name
            //                 break;
            //             case 'postal_code':
            //                 obj.postalCode = component.long_name
            //         }
            //     })
            // }

            
            //     {
            //         "long_name": "Cook County",
            //         "short_name": "Cook County",
            //         "types": [
            //             "administrative_area_level_2",
            //             "political"
            //         ]
            //     },
            //     {
            //         "long_name": "Illinois",
            //         "short_name": "IL",
            //         "types": [
            //             "administrative_area_level_1",
            //             "political"
            //         ]
            //     }
            // ],


            // [{
            //         long_name: 'Chicago',
            //         short_name: 'Chicago',
            //         types: ['locality', 'political']
            //     },
            //     {
            //         long_name: 'Chicago Loop',
            //         short_name: 'Chicago Loop',
            //         types: ['neighborhood', 'political']
            //     },
            //     {
            //         long_name: 'Cook County',
            //         short_name: 'Cook County',
            //         types: ['administrative_area_level_2', 'political']
            //     },
            //     {
            //         long_name: 'Illinois',
            //         short_name: 'IL',
            //         types: ['administrative_area_level_1', 'political']
            //     },
            //     {
            //         long_name: 'United States',
            //         short_name: 'US',
            //         types: ['country', 'political']
            //     },
            //     {
            //         long_name: '60601',
            //         short_name: '60601',
            //         types: ['postal_code']
            //     }
            // ]
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
    }
}