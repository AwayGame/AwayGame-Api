var newYorkId = 'ChIJOwg_06VPwokRYv534QaPC8g'
var config = require('../config');
module.exports = {
    getCities: function(req, res) {
        rp({
            method: "GET",
            uri: "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + newYorkId + "&key=" + config.googleApiKey,
            json: true
        }).then(function(response) {
            return res.send(response.result);
        })

        /*return res.send([
            {
                "name": "New York",
                "imageUrl": "https://i.ytimg.com/vi/Fl7V5dX5IrM/maxresdefault.jpg",
                "id": "1234"
            },
            {
                "name": "Chicago",
                "imageUrl": "https://cdn.vox-cdn.com/thumbor/tAh-6qM-gosizbPLUE90xlCp-yc=/66x0:1132x800/1200x800/filters:focal(66x0:1132x800)/cdn.vox-cdn.com/uploads/chorus_image/image/54460459/vistaexterior4.0.0.0.jpeg",
                "id": "1234"
            },
            {
                "name": "Boston",
                "imageUrl": "asd",
                "id": "1234"
            },
            {
                "name": "San Francisco",
                "imageUrl": "asd",
                "id": "1234"
            },
            {
                "name": "Los Angeles",
                "imageUrl": "asd",
                "id": "1234"
            },
            {
                "name": "Orlando",
                "imageUrl": "asd",
                "id": "1234"
            },
            {
                "name": "Miami",
                "imageUrl": "asd",
                "id": "1234"
            },
            {
                "name": "Atlanta",
                "imageUrl": "asd",
                "id": "1234"
            }
        ])*/
    }
}