const { error } = require('./utils.js');
module.exports = {
    set: function (variable, value, expireAfter = 0) {
        if (variable == 'set') return error('Cannot set variable \'set\'');
        this[variable] = value;
        if (expireAfter > 0)
            setTimeout(function () {
                delete this[variable];
            }, expireAfter)
        return value;
    }
}
// 239232   8501   2161065    52657   1611445495   2f07bbd86d5ed3caf75117a749dec23e7538b2a3   2161065