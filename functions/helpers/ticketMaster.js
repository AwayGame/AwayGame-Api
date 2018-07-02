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
                    sort: 'date,asc',
                    startDateTime: data.startDate,
                    endDateTime: data.endDate
                }
            }, function(err, response, body) {
                if (err) {
                    console.error(err);
                } else {
                    return resolve(formatEvents(JSON.parse(body)));
                }
            });

            function formatEvents(events) {
                if (!events.page.totalElements) return [];

                let eventsToFormat = []
                events._embedded.events.forEach(event => {
                    if (event.name.split('at')[0].trim() === data.team.trim()){
                        eventsToFormat.push(event)
                    }
                })

                return eventsToFormat.map(event => {
                    return {
                        name: event.name,
                        id: event.id,
                        images: event.images,
                        date: moment(event.dates.start.dateTime).format('MM/DD'),
                        time: getTime(event.dates),
                        ticketUrl: event.url
                    }
                })
            }
        })
    }
}

function getTime(dates) {
    if (dates.start.timeTBA) {
        return 'TBA'
    } else {
        return moment(dates.start.localDate + 'T' + dates.start.localTime).format('h:mm a')
    }
}

function getTeamsArray(eventName) {
    let optionOne = returnTeamsSplitByDelimiterIfValid(eventName, 'vs.')
    let optionTwo = returnTeamsSplitByDelimiterIfValid(eventName, ' at ')
    let optionThree = returnTeamsSplitByDelimiterIfValid(eventName, 'v.')

    return optionOne || optionTwo || optionThree || null
}

function returnTeamsSplitByDelimiterIfValid(eventName, delimiter) {
    var teams = eventName.split(delimiter)
    if (teamsArrayIsValid(teams)) {
        return teams
    } else {
        return null
    }
}

function teamsArrayIsValid(teams) {
    return teams && teams.length === 2
}