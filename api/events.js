var helpers = require('./helpers');

module.exports = {
	/**
	 * Finds sporting events for the user
	 * @param  {String}  team		The team that the user wants to see
	 * @param  {String}  city		The city the user is in
	 * @param  {string}  startDate 	When the user will be in town
	 * @param  {string}  endDate 	When the user will be leaving
	 * @return {Array}     			Array of sporting events
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
	        	if(events.page.totalElements === 0) return [];
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