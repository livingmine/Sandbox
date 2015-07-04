(function () {
  'use strict';
  var express = require('express');
  var app = express();
	var phantom = require('phantom');

	require('./config/config_routes')(app);
  require('./config/config_app')(app);
  

  // START THE SERVER
  console.log('STARTING THE SABRE SERVER');
  console.log('-------------------------');
  app.listen(80);
  console.log('Started the server');
  process.on('uncaughtException', function (error) {
      console.log(error.stack);
      console.log(error);
  });

})();