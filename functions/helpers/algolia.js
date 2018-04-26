const algoliasearch = require('algoliasearch')
const ALGOLIA_ID = config.algolia.appId;
const ALGOLIA_ADMIN_KEY = config.algolia.apiKey;
const ALGOLIA_SEARCH_KEY = config.algolia.searchKey;
algoliaClient = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

//Define indexes
algoliaTeamIndex = algoliaClient.initIndex('teams');

module.exports = {
	/**
	 * Searches the Algolia store for teams on the teams index
	 * @param  {String} term	The term to search 
	 * @return {Array}  content	The result found
	 */
    searchForTeams: (term) => {
        return new Promise((resolve, reject) => {
            algoliaTeamIndex.search(term, function(err, content) {
                return resolve(content.hits)
            });
        })
    }
}