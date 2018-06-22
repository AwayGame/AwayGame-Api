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
                        time: getTime(event.dates),
                        ticketUrl: event.url
                    }
                })
            }
        })
    }
}

function getTime(dates) {
    if(dates.start.timeTBA){
        return 'TBA'
    } else {
        return moment(dates.start.dateTime).format('h:mm a')
    }
}

function getTitle(eventName) {
    let teams = getTeamsArray(eventName)
    
    let teamOneWords = teams[0].trim().split(' ')
    let teamOne = _.last(teamOneWords)

    let teamTwoWords = teams[1].trim().split(' ')
    let teamTwo = _.last(teamTwoWords)
    return teamOne + " at " + teamTwo
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