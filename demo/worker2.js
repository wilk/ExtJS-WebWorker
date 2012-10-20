var timeSec = 0;
var timeMin = 0;

onmessage = function (message) {
	switch (message.data) {
		case 'start':
			start ();
			break;
		case 'stop':
			stop ();
			break;
		case 'compute':
			compute ();
			break;
		case 'log':
			log ();
			break;
		default:
			postMessage ({event: 'log', data: 'Unknown command.'});
	}
}

function start () {
	postMessage ({event: 'start', data: 'Started!'});
}

function stop () {
	postMessage ({event: 'stop', data: 'Stopped!'});
	close ();
}

function compute () {
	var dStart = new Date ();
	
	postMessage ({event: 'compute', data: 'Computation started!'});
	
	for (var i = 0; i < 9000000000; i++) {}
	
	var dEnd = new Date ();
	var diff = dEnd - dStart;
	timeSec = Math.round (diff/1000);
	timeMin = Math.round (timeSec/60);
	
	postMessage ({event: 'compute', data: 'Computation terminated!'});
}

function log () {
	postMessage ({event: 'log', data: 'Last computation time: ' + timeMin + 'm' + timeSec + 's'});
}
