const admin = require('firebase-admin');
admin.initializeApp();

exports.checkExpiredItems = require('./scheduler').checkExpiredItems;
exports.getInsights       = require('./insights').getInsights;
