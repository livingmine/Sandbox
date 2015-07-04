function sabreCall(q, res) {
  sabreDevStudio.get(q, options, function(err, data) {
    response(res, err, data);
  });
}

function response(res, err, data) {
  if (err) {
    res.status(200).send({
      'status': false,
      'message': 'Error',
      'info': err
    });
  } else {
    res.status(200).send({
      'status': true,
      'message': 'Success',
      'info': data
    });
  }
}
var phantom = require("phantom");

module.exports = function(app) {

  /*app.get('/api/v1/cities', function(req,res) {
    sabreCall('/v1/lists/supported/cities', res);
  });

  app.get('/api/v1/places', function(req,res) {
    sabreCall('/v1/shop/flights/fares?origin=' + req.query.origin +
    '&departuredate=' + req.query.departuredate +
    '&returndate=' + req.query.returndate +
    '&maxfare=' + req.query.maxfare, res);
  });*/
	
	var urlTraveloka = 'http://www.traveloka.com/fullsearch?ap=CGK.DPS&dt=01-07-2015.NA&ps=1.0.0';
	var urlNusatrip = 'http://www.nusatrip.com/flights/search?departure=CGK&arrival=DPS&departDate=20150701&adultNum=1&childNum=0&infantNum=0';
	//url = 'https://m.traveloka.com/flight/search/origin/single.CGK.DPS.2015-6-26.null.1.0.0/null/null';
	var flightsNusaTrip = [];
	var flightsTraveloka = [];
	var i = 0;
	app.get('/getflight', function(req, res){console.log("?");
		urlTraveloka = 'http://www.traveloka.com/fullsearch?ap=' + req.query.origin + '.' + req.query.destination + 
			'&dt=' + formatDateTraveloka(req.query.departuredate) + '.NA&ps=1.0.0';
		
		urlNusatrip = 'http://www.nusatrip.com/flights/search?departure=' + req.query.origin + '&arrival=' + 
			req.query.destination + '&departDate=' + formatDateNusatrip(req.query.departuredate) + 
			'&adultNum=1&childNum=0&infantNum=0';
		
		phantom.create(function(ph) {//Nusatrip
			return ph.createPage(function(page) {
				return page.open(urlNusatrip, function (status) {
					if (status !== 'success') {
							console.log('Unable to access network');
							ph.exit();
							res.send("Unable to connect!");
					}
					else{
						//res.send("Connected!");
						return page.evaluate(function(){debugger;
							var price = [], priceBig = [], priceSmall = [], airlineName = [], flight = [], timeDeparture = [], timeArrival = [];
							$('.right.flPRNum.century.bold.langid > .price-big').each(function() {//traveloka, .realPrice
								priceBig.push($(this).text());
								//console.log($(this).text());
							});
							
							$('.right.flPRNum.century.bold.langid > .price-small').each(function() {//traveloka, .realPrice
								priceSmall.push($(this).text());
								//console.log($(this).text());
							});
							
							$('.left.airline.first.relative > .left.marlin5').each(function() {//traveloka, .realPrice
								airlineName.push($(this).text().replace("\\(t|n)/g", ""));
								//console.log($(this).text());
							});
							
							$('.left.arialBlack.departure.iegtp').each(function() {//traveloka, .realPrice
								timeDeparture.push($(this).text());
								//console.log($(this).text());
							});
							
							$('.left.arialBlack.arrival.iegtp').each(function() {//traveloka, .realPrice
								timeArrival.push($(this).text().replace("\+1",""));
								//console.log($(this).text());
							});
							return{
								priceBig: priceBig,
								priceSmall: priceSmall,
								airlineName: airlineName,
								timeDeparture: timeDeparture,
								timeArrival: timeArrival
							};
							
						}, function(result){
							var price = [];
							for(i = 0; i < result.priceBig.length; i++){
								var priceBig = result.priceBig[i];
								var priceSmall = result.priceSmall[i];
								price.push(priceConverter(priceBig, priceSmall));
							}
							
							result.price = price;
							for (i = 0; i < result.price.length; i++) { 
								//flights.push(new Flight(result.price[i], result.airlineName[i], result.timeDeparture[i], result.timeArrival[i]));
								//flightsNusaTrip.push(result.price[i]);
								flightsNusaTrip.push(new Flight(result.price[i], result.airlineName[i], result.timeDeparture[i], result.timeArrival[i]));
							}
							console.log(flightsNusaTrip);
							//console.log(flights[0].airlineName);
							//console.log(flights[0].timeDeparture);
							//console.log(flights[0].timeArrival);
							//res.send(flights);
							/*res.status(200).send({
								'status': true,
								'message': 'Success',
								'info': {
									traveloka: flightsTraveloka,
									nusatrip: flightsNusaTrip
								}
							});*/
							ph.exit();
						});
						
					}
				});
			});
			
		}, {
			dnodeOpts: {weak: false}, parameters: {'ssl-protocol': 'any'}
		});
		
		
		phantom.create(function(ph) {//Traveloka
			return ph.createPage(function(page) {
				return page.open(urlTraveloka, function (status) {
					if (status !== 'success') {
							console.log('Unable to access network');
							ph.exit();
							res.send("Unable to connect!");
					}
					else{
						wait(function(cb){
							return page.evaluate(function(){
								return $('#fsLoadingMessage').length === 0;
							}, cb);
						}, function(){// onReady
							return page.evaluate(function(){
								var price = [], airlineName = [], flight = [], timeDeparture = [], timeArrival = [];
								//Consider per container to handle indirect flights by traveloka
								$('.realPrice').each(function() {//traveloka, .realPrice || mobileTraveloka, .grandTotalPrice
									price.push($(this).text());
									//console.log($(this).text());
								});
								$('.tv-fs-result-ma > .sub').each(function(){
									airlineName.push($(this).text());
								});
								$('.tv-fs-result-jp > .time').each(function(){
									timeDeparture.push($(this).text());							
								});
								$('.tv-fs-result-jt > .time').each(function(){
									timeArrival.push($(this).text());							
								});
								return{
									price: price,
									airlineName: airlineName,
									timeDeparture: timeDeparture,
									timeArrival: timeArrival
								};
								
							}, function(result){
								
								for (i = 0; i < result.price.length; i++) { 
									flightsTraveloka.push(new Flight(result.price[i], result.airlineName[i], result.timeDeparture[i], result.timeArrival[i]));
								}
								//console.log(flightsTraveloka[0].price);
								//console.log(flights[0].airlineName);
								//console.log(flights[0].timeDeparture);
								//console.log(flights[0].timeArrival);
								//res.send(JSON.stringify(flights));
								//res.send(flightsTraveloka);
								//res.status(200).send(flightsTraveloka);
								res.status(200).send({
									'status': true,
									'message': 'Success',
									'info': {
										traveloka: flightsTraveloka,
										nusatrip: flightsNusaTrip
									}
								});
								ph.exit();
							});
							
							
						}, 60000);
					}
				});
			});
		}, {
			dnodeOpts: {weak: false}, parameters: {'ssl-protocol': 'any'}
		});
		
		//res.send(flightsTraveloka);
		//res.send("Connected!");
		
		
		
	});

};

function priceConverter(priceBig, priceSmall){
	priceBig = priceBig.replace('.', '');
	priceSmall = priceSmall.replace('.', '');
	return priceBig.concat(priceSmall);
}

function formatDateTraveloka(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2) {
		month = '0' + month;
	}
	if (day.length < 2) {
		day = '0' + day;
	}

	return [day, month, year].join('-');
}

function formatDateNusatrip(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2) {
		month = '0' + month;
	}
	if (day.length < 2) {
		day = '0' + day;
	}

	return [year, month, day].join('');
}


function Flight(price, airlineName, timeDeparture, timeArrival) {
	this.price = price;
	this.airlineName = airlineName;
	this.timeDeparture = timeDeparture;
	this.timeArrival = timeArrival;
};

function wait(testFx, onReady, maxWait, start) {
	var start = start || new Date().getTime();
	if (new Date().getTime() - start < maxWait) {
		testFx(function(result) {
			if (result) {
				onReady();
			} else {
				setTimeout(function() {
					wait(testFx, onReady, maxWait, start);
				}, 250);
			}
		});
	} else {
		console.error('page timed out');
		ph.exit();
	}
}