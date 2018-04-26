module.exports = {
    getLocationsOfRestaurants: function(req, res) {
        if (!req.body.category) return res.status(500).send({
            error: "You must include a category"
        });

        var category = config.yelp.foodCategories[req.body.category];
        if (!category) return res.status(500).send({
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
            console.log("here is the respnse: ", response)
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
    },
    getCities: function(req, res) {
        db.collection('cities')
            .get()
            .then(snapshot => {
                var cities = [];
                snapshot.forEach(city => cities.push(city.data()));
                return res.send(cities);
            })
    },
    getTeamsFromCity: function(req, res) {
        db.collection('cities')
            .doc(req.params.cityId)
            .get()
            .then(doc => {
                if (doc.exists) {
                    db.collection('teams')
                        .where('city', '==', doc.data().name)
                        .get()
                        .then(snapshot => {
                            var teams = [];
                            snapshot.forEach(team => teams.push(team.data()));
                            return res.send(teams);
                        })
                } else {
                    return res.send({
                        errorMessage: 'No city found with id ' + req.params.cityId,
                        error: 404
                    })
                }
            })
    },
    /**
     * Finds sporting events for the user
     * @param  {String}  team       The team that the user wants to see
     * @param  {String}  city       The city the user is in
     * @param  {string}  startDate  When the user will be in town
     * @param  {string}  endDate    When the user will be leaving
     * @return {Array}              Array of sporting events
     */
    searchTicketMasterForEvents: function(req, res) {
        db.collection('cities')
            .where('name', '==', req.body.city)
            .limit(1)
            .get()
            .then(snapshot => {
                var city = null;
                snapshot.forEach(doc => {
                    city = doc.data();
                })

                rp({
                    uri: config.ticketMasterApi.discoveryApiUrl,
                    method: 'GET',
                    qs: {
                        apikey: config.ticketMasterApi.clientId,
                        classificationName: "sports",
                        dmaId: city.ticketMasterDmaId,
                        keyword: req.body.team,
                        sort: 'date,asc',
                        startDateTime: helpers.formatDate(new Date(req.body.startDate)),
                        endDateTime: helpers.formatDate(new Date(req.body.endDate))
                    }
                }, function(err, response, body) {
                    if (err) {
                        console.error(err);
                    } else {
                        return res.send(formatEvents(JSON.parse(body)));
                    }
                });

                function formatEvents(events) {
                    if (events.page.totalElements === 0) return [];
                    return events._embedded.events.map(event => {
                        return {
                            name: event.name,
                            date: event.dates.start.dateTime
                        }
                    })
                }
            })

    }
}