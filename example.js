var lib = require('./lib');
var config = require('./config.js');

window.money = window.money || {};
window.money.homepage = new lib.AdsFactory();
window.money.homepage.init(config);
