angular.module('getLostApp', ['lumx']).
controller('MainCtrl', function($rootScope, $scope, $http, LxProgressService) {

  // Get the cities data that I can show in the drop-down
  /*$http.get('/api/v1/cities').success(function(data) {
    $scope.cities = data;
    console.log($scope.cities);
  }).error(function(err) {
    $scope.error = err;
    $scope.error = err;
  });*/

  // Set some prices that I can show in the prices drop-down
  $scope.origins = [
    {code:'CGK', value:'Cengkareng'},
    {code:'DPS', value:'Denpasar'}
  ];
	
	$scope.destinations = [
    {code:'CGK', value:'Cengkareng'},
    {code:'DPS', value:'Denpasar'}
  ];

  // Initialize this with what to show when the page is loaded
  $scope.info = {
    origin: {code:'CGK', value:'Cengkareng'},
    destination: {code:'DPS', value:'Denpasar'},
    returndate: formatDateCalendar(new Date()),
    departuredate: formatDateCalendar(new Date())
  };

  // Call the server to get the fares info
	$scope.submit = function(){
		$scope.fareinfoTraveloka = [];
		$scope.fareinfoNusatrip = [];
		$scope.isProcessing = true;
		LxProgressService.linear.show('#5fa2db', '#progress');
		$http.get('/getflight/?origin=' + $scope.info.origin.code +
      '&destination=' + $scope.info.destination.code +
      '&departuredate=' + $scope.info.departuredate).success(function(data) {
        $scope.results = data;
        $scope.dataTraveloka = data.info.traveloka;
				$scope.dataNusatrip = data.info.nusatrip;
				
				$scope.dataFinished = sortFlights($scope.dataTraveloka, $scope.dataNusatrip);
				
        if ($scope.results.status) {
					if($scope.dataFinished.reference === "Traveloka"){
						$scope.fareinfoTraveloka = $scope.dataFinished.flightsReference;
						$scope.fareinfoNusatrip = $scope.dataFinished.flightsFollower;
					}
					else{
						$scope.fareinfoTraveloka = $scope.dataFinished.flightsFollower;
						$scope.fareinfoNusatrip = $scope.dataFinished.flightsReference;
					}
          //$scope.fareinfoTraveloka = $scope.dataTraveloka;
					//$scope.fareinfoNusatrip = $scope.dataNusatrip;
        } else {
          $scope.error = JSON.parse($scope.data.data).message;
        }
				$scope.hideLinearProgress();
				$scope.isProcessing = false;
				//$scope.fareinfo = data;
				//debugger;
    }).error(function(err) {//debugger;
      $scope.error = JSON.parse(err.data).message;
			//debugger;
    });
	};

	$scope.hideLinearProgress = function(){
		LxProgressService.linear.hide();
	};

  // Helper function from stackoverflow so that I can format the date before sending to the server
  function formatDate(date) {
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
	
	function formatDateCalendar(date) {
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

    return [year, month, day].join('-');
  }
	
	function sortFlights(flightsA, flightsB){
		var flightsReference;
		var flightsFollower;
		var flightsFollowerReturned = [];
		var largeNumber = 900;
		var reference = '';
		if(flightsA.length >= flightsB.length){
			flightsReference = flightsA;
			flightsFollower = flightsB;
			reference = "Traveloka";
		}
		else{
			flightsReference = flightsB;
			flightsFollower = flightsA;
			reference = "Nusatrip";
		}
	
		flightsReference.sort(compareByAirlineName);
		
		for(i = 0; i < flightsReference.length; i++){
			flightsReference[i].key = i;
			for(j = 0; j < flightsFollower.length; j++){
				if(flightsReference[i].airlineName.length >= flightsFollower[j].airlineName.length){
					var longerAirlineName = flightsReference[i].airlineName;
					var shorterAirlineName = flightsFollower[j].airlineName;
				}
				else{
					var longerAirlineName = flightsFollower[j].airlineName;
					var shorterAirlineName = flightsReference[i].airlineName;
				}
				
				var patt = new RegExp(shorterAirlineName, 'i');
				if(j === flightsFollower.length - 1){
					if(longerAirlineName.match(patt)){
						if(flightsReference[i].timeDeparture === flightsFollower[j].timeDeparture &&
								flightsReference[i].timeArrival === flightsFollower[j].timeArrival){
							flightsFollower[j].key = i;
							flightsFollowerReturned.push(flightsFollower[j]);
							break;
						}
						else{
							//flightsFollower[j].key = largeNumber;
							//largeNumber += 1;
							flightsFollowerReturned.push({
								price: "-",
								airlineName: "-",
								timeDeparture: "-",
								timeArrival: "-",
								key: i
							});
						}
					}
					else{
						flightsFollowerReturned.push({
								price: "-",
								airlineName: "-",
								timeDeparture: "-",
								timeArrival: "-",
								key: i
							});
					}
				}
				else{
					if(longerAirlineName.match(patt)){//Consider time Arrival also
						if(flightsReference[i].timeDeparture === flightsFollower[j].timeDeparture && 
								flightsReference[i].timeArrival === flightsFollower[j].timeArrival){
							flightsFollower[j].key = i;
							flightsFollowerReturned.push(flightsFollower[j]);
							break;
						}
					}
					
				}
				
			}
		}
		
		flightsFollower.sort(compareByKey);
		
		return {
			flightsReference: flightsReference,
			flightsFollower: flightsFollowerReturned,
			reference: reference
		}
		
		function compareByAirlineName(a,b) {
			if (a.airlineName < b.airlineName)
				return -1;
			if (a.airlineName > b.airlineName)
				return 1;
			return 0;
		}
		
		function compareByKey(a,b) {
			if (a.key < b.key)
				return -1;
			if (a.key > b.key)
				return 1;
			return 0;
		}

			
	}
	
	
});