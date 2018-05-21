// Helper functions

module.exports = {
    checkForMissingFields: (requiredParams, data) => {
        let missingKeys = []
        requiredParams.forEach(function(key) {
            if (Object.keys(data).indexOf(key) < 0) {
                missingKeys.push(key)
            }
        })

        return missingKeys
    },
    formatDate: (date) => {
        var year = date.getFullYear();
        var month = addExtraZero(date.getMonth() + 1);
        var day = addExtraZero(date.getDate());

        var hours = addExtraZero(date.getHours());
        var minutes = addExtraZero(date.getMinutes());
        var seconds = addExtraZero(date.getSeconds());

        var strToReturn = '';
        strToReturn += [year, month, day].join('-') + 'T';
        strToReturn += [hours, minutes, seconds].join(':') + 'Z';
        return strToReturn;

        function addExtraZero(val) {
            return ((val < 10) ? ('0' + val) : val)
        }
    },
    milesToRadius: (miles) => {
        return config.milesToRadiusConversions[miles]
    },
    shuffleArray: (array) => {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
    removeDuplicates: (array, key) => {
        return array.filter((item, index, self) => self.findIndex(b => b[key] === item[key]) === index)
    },
    addProvider: (array, provider) => {
        array.forEach(result => {
            result.provider = provider
        })
        return array
    },
    sortByKey: (array, key) => {
        array = array.sort(function(a, b) {
            return b[key] - a[key]
        });
        return array
    }
}