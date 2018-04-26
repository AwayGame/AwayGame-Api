var helpers = require('./helpers')

module.exports = {
    /**
     * Searches the Algolia store for teams on the teams index
     * @param  {String} term    The term to search 
     * @return {Array}  content The result found
     */
    searchForGames: (data) => {
        return new Promise((resolve, reject) => {
            let missingFields = helpers.checkForMissingFields(['team', 'startDate', 'endDate'], data)
            if(missingFields.length) {
                return reject({
                    status: 422,
                    error: 'Missing required fields: ' + missingFields.join(', ')
                })
            }

            rp({
                uri: config.ticketMasterApi.discoveryApiUrl,
                method: 'GET',
                qs: {
                    apikey: config.ticketMasterApi.clientId,
                    classificationName: "sports",
                    keyword: data.team,
                    sort: 'date,desc',
                    startDateTime: helpers.formatDate(new Date(data.startDate)),
                    endDateTime: helpers.formatDate(new Date(data.endDate))
                }
            }, function(err, response, body) {
                if (err) {
                    console.error(err);
                } else {
                    return resolve(formatEvents(JSON.parse(body)));
                }
            });

            function formatEvents(events) {
                if (events.page.totalElements === 0) return [];
                return events._embedded.events.map(event => {
                    return {
                        name: event.name,
                        id: event.id,
                        images: event.images,
                        date: event.dates,
                        stadium: event._embedded.venues[0]
                    }
                })
            }
        })
    }
}