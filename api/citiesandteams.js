module.exports = {
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
    }
}

// rp({
//   uri: config.fourSqaure.fourSquareExploreApiEndpoint,
//   method: 'GET',
//   qs: {
//     client_id: config.fourSqaure.clientId,
//     client_secret: config.fourSqaure.clientSecret,
//     ll: '40.7243,-74.0018',
//     query: 'coffee',
//     v: '20170801',
//   }
// }, function(err, response, body) {
//   if (err) {
//     console.error(err);
//   } else {
//     return res.send(JSON.parse(body).response);
//   }
// });

// rp({
//     method: "GET",
//     uri: "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + newYorkId + "&key=" + config.googleApiKey,
//     json: true
// }).then(function(response) {
//     return res.send(response.result);
// })