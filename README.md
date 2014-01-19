# ExtJS-WebWorker

ExtJS-WebWorker is an extension to handle and use the HTML5 WebWorker with ExtJS and Sencha Touch.

It has two classes: `Ext.ux.WebWorker` and `Ext.ux.WebWorkerManager`<br/>
The first one is a wrapper for standard HTML5 WebWorker and it provides a lot of interesting and easy-to-use features.
The second one is a singleton to register different Ext.ux.WebWorker and it provides functions to work with every registered webworker at the same time.

## Install via Bower
First of all, install [**Bower**](http://bower.io/).

Then install `Ext.ux.WebWorker`:

```bash
$ bower install ext.ux.webworker
```

Now, you got the extension at the following path: *YOUR_PROJECT_PATH/bower_components/ext.ux.webworker/*

It contains **WebWorker.js** and **WebWorkerManager.js** files and a minified version **WebWorker.min.js** and **WebWorkerManager.min.js**.

Let's setup the **Ext.Loader** to require the right file:

```javascript
Ext.Loader.setConfig ({
	enabled: true ,
	paths: {
		'Ext.ux.WebWorker': 'bower_components/ext.ux.webworker/WebWorker.js' ,
		// or the minified one: 'Ext.ux.WebWorker': 'bower_components/ext.ux.webworker/WebWorker.min.js'
		'Ext.ux.WebWorkerManager': 'bower_components/ext.ux.webworker/WebWorkerManager.js' ,
		// or the minified one: 'Ext.ux.WebWorkerManager': 'bower_components/ext.ux.webworker/WebWorkerManager.min.js'
	}
});

Ext.require (['Ext.ux.WebWorker', 'Ext.ux.WebWorkerManager']);
```

## Usage
Load `Ext.ux.WebWorker` and `Ext.ux.WebWorkerManager` via `Ext.require`:

```javascript
Ext.Loader.setConfig ({
	enabled: true
});

Ext.require (['Ext.ux.WebWorker', 'Ext.ux.WebWorkerManager']);
```

Now, you are ready to use them in your code as follows:

```javascript
// There are two ways to create a worker: from a file or inline.

// Build a worker from a different file
var ww = Ext.create ('Ext.ux.WebWorker', {
	file: 'myWorker.js'
});

// Build a worker inline
var ww = Ext.create ('Ext.ux.WebWorker', {
	blob: 'onmessage = function (e) {postMessage ("A message from worker: + " e.data);}'
});

// Using Ext.ux.WebWebWorkerManager
Ext.ux.WebWorkerManager.register (ww);
```

## Communications supported
### Pure text communication
The communication is text-only, without objects or any other kind of data.

```javascript
var webworker = Ext.create ('Ext.ux.WebWorker', {
	file: 'myWorker.js' ,
	listeners: {
		message: function (ww, message) {
			console.log ('A new message is arrived: ' + message);
		} ,
		error: function (ww, error) {
			Ext.Error.raise (error);
		}
	}
});

// myWorker.js
postMessage ('this is the message!');
```

### Pure event-driven communication
The communication is event-driven: an event and a String or Object are sent and the webworker handles different events.

```javascript
var webworker = Ext.create ('Ext.ux.WebWorker', {
	file: 'myWorker.js' ,
	listeners: {
		start: function (ww, message) {
			console.log (message);
			ww.send ('parse', 'a string to parse');
		} ,
		verify: function (ww, message) {
			console.log (message);
			ww.send ('verify equation', {
				equation: 'x+y-z=10' ,
				x: 10 ,
				y: 5 ,
				z: 5
			});
		}
	}
});

// A 'terminate' event is sent from the worker (myWorker.js)
// 'data' has 'log' and 'msg' fields
webworker.on ('terminate', function (data) {
	console.log ('Log: ' + data.log);
	console.log ('Message: ' + data.msg);
});

webworker.send ({
	event: 'start'
});

// myWorker.js
onmessage = function (message) {
	switch (message.event) {
		case 'start':
			postMessage ({
				event: 'start' ,
				data: 'WebWorker started!'
			});
			break;
		case 'parse':
			postMessage ({
				event: 'verify' ,
				data: 'String parsed! Next!'
			});
			break;
		case 'verify equation':
			postMessage ({
				event: 'terminate' ,
				data: {
					log: message.data.x + '+' + message.data.y + '-' + message.data.z + '=10' ,
					msg: 'Equation verified! Terminate!'
				}
			});
			close ();
			break;
	}
}
```

### Mixed communication
The communication is mixed: it handles text-only and event-driven communication.

```javascript
var webworker = Ext.create ('Ext.ux.WebWorker', {
	file: 'myWorker.js' ,
	listeners: {
		message: function (ww, message) {
			console.log ('Text-only message arrived is: ' + message);
		}
	}
});

webworker.send ({
	event: 'echo' ,
	data: 'Send me a pure-text message plz!'
});

// myWorker.js
onmessage = function (message) {
	switch (message.event) {
		case 'echo':
			postMessage (message.data);
			break;
	}
}
```

## Ext.ux.WebWorkerManager features
Here's an example of the manager:

```javascript
var ww1 = Ext.create ('Ext.ux.WebWorker', {
	file: 'myWorker.js'
});

Ext.ux.WebWorkerManager.register (ww1);

var blob = [
	'onmessage = function (msg) {' ,
	'	if (msg.event === "system shutdown") {' ,
	'		var res = {' ,
	'			event: "stop" ,' ,
	'			data: "Computation of worker 2 terminates correctly in 15h13m20s."' ,
	'		};' ,
	'		postMessage (res);' ,
	'	}' ,
	'}'
].join ('');

var ww2 = Ext.create ('Ext.ux.WebWorker', {
	blob: blob
});

Ext.ux.WebWorkerManager.register (ww2);

var ww3 = Ext.create ('Ext.ux.WebWorker', {
	file: 'otherWorker.js'
});

Ext.ux.WebWorkerManager.register (ww3);

Ext.ux.WebWorkerManager.listen ('stop', function (ww, data) {
	Ext.Msg.show ({
		title: 'Worker stopped' ,
		msg: 'Log of the computation: ' + data ,
		icon: Ext.Msg.INFO ,
		buttons: Ext.Msg.OK
	});
});

// This will be handled by everyone
Ext.ux.WebWorkerManager.broadcast ('system shutdown', 'BROADCAST: the system will shutdown in few minutes.');

Ext.ux.WebWorkerManager.stopAll ();

Ext.ux.WebWorkerManager.unregister (ww1);
Ext.ux.WebWorkerManager.unregister (ww2);
Ext.ux.WebWorkerManager.unregister (ww3);
```

## Run the demo
Go to *http://localhost/ExtJS-WebWorker/demo* and play it!

## Documentation
You can build the documentation (like ExtJS Docs) with [**jsduck**](https://github.com/senchalabs/jsduck):

```bash
$ jsduck ux --output /var/www/docs
```

It will make the documentation into docs dir and it will be visible at: http://localhost/docs

## License
The MIT License (MIT)

Copyright (c) 2013 Vincenzo Ferrari <wilk3ert@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
