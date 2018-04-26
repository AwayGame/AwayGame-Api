module.exports = {
    checkForMissingFields: function(requiredParams, data) {
        let missingKeys = []
        requiredParams.forEach(function(key) {
            if(Object.keys(data).indexOf(key) < 0){
                missingKeys.push(key)
            }
        })

        return missingKeys
    },
    formatDate: function(date) {        
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
    }    
}
