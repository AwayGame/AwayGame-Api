var helpers = require('./helpers')

module.exports = {
    searchForGames: (data) => {
        return new Promise((resolve, reject) => {
            let missingFields = helpers.checkForMissingFields(['team', 'startDate', 'endDate'], data)
            let games = null
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
                    if (!JSON.parse(body).page.totalElements) return resolve([])

                    games = JSON.parse(body)._embedded.events
                    removeDuplicates()

                    return resolve(formatEvents(games));
                }
            });

            function removeDuplicates() {
                let pairs = []
                let finalListOfGames = []

                for (let i = 0; i < games.length; i++) {
                    let gameOne = games[i]
                    let matched = false
                    for (let j = 0; j < games.length; j++) {
                        let gameTwo = games[j]
                        if (gameOne.id != gameTwo.id && isPair(gameOne, gameTwo) && !pairIsInPairs(pairs, gameOne.id + '-' + gameTwo.id)) {
                            matched = true
                            pairs.push({
                                gameOne: gameOne,
                                gameTwo: gameTwo
                            })
                        }
                    }

                    if (!matched && getTeamsArray(gameOne.name)) {
                        finalListOfGames.push(gameOne)
                    }
                }

                pairs.forEach(pair => {
                    finalListOfGames.push(getAwayGame(pair))
                })

                // Add games that did not have a pair

                games = _.uniq(finalListOfGames)
            }

            function getAwayGame(pair) {
                let city = pair.gameOne._embedded.venues[0].city.name
                let teamOne = getTeamsArray(pair.gameOne.name)[1]
                let teamTwo = getTeamsArray(pair.gameTwo.name)[1]

                if (teamOne.includes(city)) {
                    return pair.gameOne
                } else {
                    return pair.gameTwo
                }
            }

            function pairIsInPairs(pairs, id) {
                return pairs.some(pair => {
                    return id === (pair.gameOne.id + '-' + pair.gameTwo.id) || id === (pair.gameTwo.id + '-' + pair.gameOne.id)
                })
            }

            function teamNamesMatch(gameOne, gameTwo) {
                let gameOneTeams = getTeamsArray(gameOne.name)
                let gameTwoTeams = getTeamsArray(gameTwo.name)
                if (!gameOneTeams || !gameTwoTeams) return false
                return gameOneTeams[0].trim() === gameTwoTeams[1].trim() && gameOneTeams[1].trim() === gameTwoTeams[0].trim()
            }

            function isPair(gameOne, gameTwo) {
                if (!teamNamesMatch(gameOne, gameTwo)) {
                    return false
                }

                if (gameOne.name.includes('vs') && gameTwo.name.includes('vs') || gameOne.name.includes('at') && gameTwo.name.includes('at')) {
                    return false
                }

                let gameOneDate = moment(gameOne.dates.start.dateTime)
                let gameTwoDate = moment(gameTwo.dates.start.dateTime)

                return (gameOneDate.isSame(gameTwoDate, 'day') && Math.abs(gameTwoDate.diff(gameOneDate, 'minutes')) <= 15)
            }

            function getId(url) {
                return url.split('/c/')[1].split('?')[0]
            }

            function formatEvents(events) {
                return games.map(game => {
                    return {
                        name: getTitle(game.name),
                        id: game.id,
                        images: game.images,
                        date: moment(game.dates.start.localDate).format('MM/DD'),
                        time: getTime(game.dates),
                        ticketUrl: game.url
                    }
                })
            }
        })
    }
}

function getTitle(eventName) {
    let teams = getTeamsArray(eventName)
    return teams[0].trim() + " at " + teams[1].trim()
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