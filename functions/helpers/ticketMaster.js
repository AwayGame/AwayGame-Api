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
            if (missingFields.length) {
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
                    startDateTime: data.startDate,
                    endDateTime: data.endDate
                }
            }, function(err, response, body) {
                console.log("error?: ", err)
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
                        name: getTitle(event.name),
                        id: event.id,
                        images: event.images,
                        date: moment(event.dates.start.dateTime).format('MM/DD'),
                        time: moment(event.dates.start.dateTime).format('h:mm a'),
                        ticketUrl: event.url
                    }
                })
            }
        })
    }
}

function getTitle(eventName) {
    try {
        let teams = eventName.split('vs. ')
        let teamOneWords = teams[0].trim().split(' ')
        let teamOne = _.last(teamOneWords)

        let teamTwoWords = teams[1].trim().split(' ')
        let teamTwo = _.last(teamTwoWords)
        return teamOne + " at " + teamTwo
    } catch (e) {
        console.log("ERROR: ", e)
    }
}