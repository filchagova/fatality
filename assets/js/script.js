$(function(){

	/* Configuration */

	var DEG = 'c';			// для Цельсію

	var weatherDiv = $('#weather'),
		scroller = $('#scroller'),
		location = $('p.location');

	// Підтримка браузером геолокації + помилка, якщо не показує
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
	}
	else{
		showError("Your browser does not support Geolocation!");
	}

	// локація + дані APIшки OpenWeatherMap
	// =назва локації і прогноз

	function locationSuccess(position) {

		try{

			// Отримуємо кеш
			var cache = localStorage.weatherCache && JSON.parse(localStorage.weatherCache);

			var d = new Date();

			// If кеш новіший, ніж 30 хвилин, юзаємо кеш
			if(cache && cache.timestamp && cache.timestamp > d.getTime() - 30*60*1000){

				// Зміщення від UTC (поворот зміщення хвилин в мілісекунди)
				var offset = d.getTimezoneOffset()*60*1000;
				var city = cache.data.city.name;
				var country = cache.data.city.country;

				$.each(cache.data.list, function(){
					// "this" підтримує обєкт прогнозу

					// Запит на отримання часу (api повертає назад в utc)
					var localTime = new Date(this.dt*1000 - offset);

					addWeather(
						this.weather[0].icon,
						moment(localTime).calendar(),	// Юзаємо б-ку moment.js для того,щоб форматувати дату
						this.weather[0].main + ' <b>' + convertTemperature(this.main.temp_min) + '°' + DEG +
												' / ' + convertTemperature(this.main.temp_max) + '°' + DEG+'</b>'
					);

				});

				// Повертаємо локацію на сайт
				location.html(city+', <b>'+country+'</b>');

				weatherDiv.addClass('loaded');

				// Налаштовуємо слайди на хоумпейдж
				showSlide(0);

			}

			else{
			
				// Звертаємось до AJAX якщо кеш застарів 

				var weatherAPI = 'http://api.openweathermap.org/data/2.5/forecast?lat='+position.coords.latitude+
									'&lon='+position.coords.longitude+'&callback=?'

				$.getJSON(weatherAPI, function(response){

					//Кешуємо
					localStorage.weatherCache = JSON.stringify({
						timestamp:(new Date()).getTime(),	// getTime() повертає в мілісек
						data: response
					});

					// Повторний виклик функції
					locationSuccess(position);
				});
			}

		}
		catch(e){
			showError("We can't find information about your city!");
			window.console && console.error(e);
		}
	}

	function addWeather(icon, day, condition){

		var markup = '<li>'+
			'<img src="assets/images/icons/'+ icon +'.png" />'+
			' <p class="day">'+ day +'</p> <p class="cond">'+ condition +
			'</p></li>';

		scroller.append(markup);
	}

	/* Handling the previous / next arrows */

	var currentSlide = 0;
	weatherDiv.find('a.previous').click(function(e){
		e.preventDefault();
		showSlide(currentSlide-1);
	});

	weatherDiv.find('a.next').click(function(e){
		e.preventDefault();
		showSlide(currentSlide+1);
	});


	// керування кнопками

	$(document).keydown(function(e){
		switch(e.keyCode){
			case 37: 
				weatherDiv.find('a.previous').click();
			break;
			case 39:
				weatherDiv.find('a.next').click();
			break;
		}
	});

	function showSlide(i){
		var items = scroller.find('li');

		if (i >= items.length || i < 0 || scroller.is(':animated')){
			return false;
		}

		weatherDiv.removeClass('first last');

		if(i == 0){
			weatherDiv.addClass('first');
		}
		else if (i == items.length-1){
			weatherDiv.addClass('last');
		}

		scroller.animate({left:(-i*100)+'%'}, function(){
			currentSlide = i;
		});
	}

	/* Error handling functions */

	function locationError(error){
		switch(error.code) {
			case error.TIMEOUT:
				showError("A timeout occured! Please try again!");
				break;
			case error.POSITION_UNAVAILABLE:
				showError('We can\'t detect your location. Sorry!');
				break;
			case error.PERMISSION_DENIED:
				showError('Please allow geolocation access for this to work.');
				break;
			case error.UNKNOWN_ERROR:
				showError('An unknown error occured!');
				break;
		}

	}

	function convertTemperature(kelvin){
		// функція перераховує фаренгейти в цельсії:
		return Math.round(DEG == 'c' ? (kelvin - 273.15) : (kelvin*9/5 - 459.67));
	}

	function showError(msg){
		weatherDiv.addClass('error').html(msg);
	}

});
