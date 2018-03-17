module.exports = {
    getBusinesses: function(req, res) {
        rp({
            method: "GET",
            headers: {
                Authorization: 'Bearer ' + config.yelpFusionApiKey
            },
            uri: "https://api.yelp.com/v3/businesses/search?location='newyorkcity'",
            json: true
        }).then(function(response) {
            return res.send(response);
        })
    }
}