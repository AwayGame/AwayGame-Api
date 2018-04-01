module.exports = {
    getLocationsOfRestaurants: function(req, res) {
        if(!req.body.category) return res.status(500).send({
            error: "You must include a category"
        });

        var category = config.yelp.foodCategories[req.body.category];
        if(!category) return res.status(500).send({
            error: "The category you entered does not match any in our datbase."
        });

        var url = buildUrl(category)

        rp({
            method: "GET",
            headers: {
                Authorization: 'Bearer ' + config.yelp.fusionApiKey
            },
            uri: url,
            json: true
        }).then(function(response) {
            return res.send(response.businesses);
        })

        function buildUrl(category) {
            var url = 'https://api.yelp.com/v3/businesses/search?';
            //add longitude/latitude
            url += 'longitude=' + req.body.longitude + '&latitude=' + req.body.latitude;
            //url add term and category
            url += '&term="' + category.term + '"&categories="' + category.categories.join(',') + '"';
            return url;
        }
    }
}