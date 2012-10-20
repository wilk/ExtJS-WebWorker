Ext.Loader.setConfig ({
	paths: {
		'Ext': '..'
	} ,
	enabled: true
});

Ext.require (['Ext.ux.WebWorker', 'Ext.ux.WebWorkerManager']);

Ext.onReady (function () {
	// Shortcut for WebWorkerManager
	var wwm = Ext.ux.WebWorkerManager;
	
	var webworker0, webworker1, webworker2;
	
	// Inline web worker
	var blob = [
		'var timeMin = 0;' ,
		'var timeSec = 0;' ,
		'function start () {' ,
			'postMessage ({event: "start", data: "Started!"});' ,
		'}' ,
		'function stop () {' ,
			'postMessage ({event: "stop", data: "Stopped!"});'	,
			'close ();' ,
		'}' ,
		'function compute () {' ,
			'var dStart = new Date ();' ,
			'postMessage ({event: "compute", data: "Computation started!"});' ,
			'for (var i = 0; i < 3000000000; i++) {}' ,
			'var dEnd = new Date ();' ,
			'var diff = dEnd - dStart;' ,
			'timeSec = Math.round (diff/1000);' ,
			'timeMin = Math.round (timeSec/60);' ,
			'postMessage ({event: "compute", data: "Computation terminated!"});' ,
		'}' ,
		'function log () {' ,
			'postMessage ({event: "log", data: "Last computation time: " + timeMin + "m" + timeSec + "s"});' ,
		'}' ,
		'onmessage = function (message) {' ,
			'switch (message.data) {' ,
				'case "start":' ,
					'start ();' ,
					'break;' ,
				'case "stop":' ,
					'stop ();' ,
					'break;' ,
				'case "compute":' ,
					'compute ();' ,
					'break;' ,
				'case "log":' ,
					'log ();' ,
					'break;' ,
				'default:' ,
					'postMessage ({event: "unknown", data: "Unknown command."});' ,
			'}' ,
		'}'
	].join ('');
	
	// Updates the correct textarea
	function writeLog (taId, event, message) {
		var ta = Ext.getCmp (taId);
		ta.setValue (ta.getValue () + event + ': ' + message + '\n');
	}
	
	// Resets webworkers and textareas
	function resetAll () {
		wwm.stopAll ();
		
		Ext.each (Ext.ComponentQuery.query('textarea'), function (ta) {
			ta.reset ();
		});
		
		webworker0 = Ext.create ('Ext.ux.WebWorker', {
			blob: blob ,
			itemId: 'Web Worker 0' ,
			listeners: {
				start: function (ww, message) {
					writeLog ('taWebWorker0Log', 'start', message);
				} ,
				compute: function (ww, message) {
					writeLog ('taWebWorker0Log', 'compute', message);
				} ,
				log: function (ww, message) {
					writeLog ('taWebWorker0Log', 'log', message);
				} ,
				stop: function (ww, message) {
					writeLog ('taWebWorker0Log', 'stop', message);
					wwm.unregister (ww);
				} ,
				unknown: function (ww, message) {
					writeLog ('taWebWorker0Log', 'unknown', message);
				}
			}
		});

		webworker1 = Ext.create ('Ext.ux.WebWorker', {
			file: 'worker1.js' ,
			itemId: 'Web Worker 1' ,
			listeners: {
				start: function (ww, message) {
					writeLog ('taWebWorker1Log', 'start', message);
				} ,
				compute: function (ww, message) {
					writeLog ('taWebWorker1Log', 'compute', message);
				} ,
				log: function (ww, message) {
					writeLog ('taWebWorker1Log', 'log', message);
				} ,
				stop: function (ww, message) {
					writeLog ('taWebWorker1Log', 'stop', message);
					wwm.unregister (ww);
				} ,
				unknown: function (ww, message) {
					writeLog ('taWebWorker1Log', 'unknown', message);
				}
			}
		});

		webworker2 = Ext.create ('Ext.ux.WebWorker', {
			file: 'worker2.js' ,
			itemId: 'Web Worker 2' ,
			listeners: {
				start: function (ww, message) {
					writeLog ('taWebWorker2Log', 'start', message);
				} ,
				compute: function (ww, message) {
					writeLog ('taWebWorker2Log', 'compute', message);
				} ,
				log: function (ww, message) {
					writeLog ('taWebWorker2Log', 'log', message);
				} ,
				stop: function (ww, message) {
					writeLog ('taWebWorker2Log', 'stop', message);
					wwm.unregister (ww);
				} ,
				unknown: function (ww, message) {
					writeLog ('taWebWorker2Log', 'unknown', message);
				}
			}
		});
		
		wwm.register ([webworker0, webworker1, webworker2]);
		
		wwm.listen ('message', function (webworker, message) {
			var taLog = Ext.getCmp ('taWebWorkersLog');
			taLog.setValue (taLog.getValue () + webworker.getItemId () + ') ' + message.event + ': ' + message.data + '\n');
		});
	}
	
	resetAll ();
	
	// Web Worker panel
	Ext.define ('workerPanel', {
		extend: 'Ext.panel.Panel' ,
		alias: 'widget.workerpanel' ,
		
		layout: {
			type: 'vbox' ,
			align: 'stretch'
		} ,
		
		tbar: {
			xtype: 'toolbar' ,
			items: [{
				xtype: 'textfield' ,
				flex: 1 ,
				fieldLabel: 'Send a command' ,
				emptyText: 'start, compute, log, stop' ,
				enableKeyEvents: true ,
				listeners: {
					specialkey: function (tf, evt) {
						if (evt.getKey () === evt.ENTER) {
							tf.up('workerpanel').worker.send (tf.getValue().toLowerCase ());
							tf.reset ();
						}
					}
				}
			}]
		}
	});
	
	// Main view
	Ext.create ('Ext.container.Container', {
		renderTo: Ext.getBody () ,
		layout: {
			type: 'vbox' ,
			align: 'center' ,
			pack: 'center'
		} ,
		
		items: [{
			xtype: 'panel' ,
			title: 'DEMO Ext.ux.WebWorker && Ext.ux.WebWorkerManager' ,
			width: 500 ,
		
			layout: {
				type: 'vbox' ,
				align: 'stretch'
			} ,
			
			tbar: {
				xtype: 'toolbar' ,
				items: ['->', '-' ,{
					xtype: 'button' ,
					text: 'Reset all' ,
					icon: 'switch.png' ,
					handler: resetAll
				}]
			} ,
		
			items: [{
				// Broadcast panel
				xtype: 'panel' ,
				title: 'Broadcast Command' ,
				bodyPadding: 5 ,
				layout: {
					type: 'vbox' ,
					align: 'stretch'
				} ,
				items: [{
					xtype: 'textarea' ,
					id: 'taWebWorkersLog' ,
					fieldLabel: 'Log of every web workers' ,
					labelAlign: 'top'
				}] ,
				
				tbar: {
					xtype: 'toolbar' ,
					items: [{
						xtype: 'textfield' ,
						flex: 1 ,
						fieldLabel: 'Broadcast a command:' ,
						labelWidth: 150 ,
						emptyText: 'start, compute, log, stop' ,
						enableKeyEvents: true ,
						listeners: {
							specialkey: function (tf, evt) {
								if (evt.getKey () === evt.ENTER) {
									wwm.broadcast (tf.getValue().toLowerCase ());
									tf.reset ();
								}
							}
						}
					}]
				}
			} , {
				xtype: 'workerpanel' ,
				title: 'Web Worker #0' ,
				worker: webworker0 ,
				items: [{
					xtype: 'textarea' ,
					id: 'taWebWorker0Log'
				}]
			} , {
				xtype: 'workerpanel' ,
				title: 'Web Worker #1' ,
				worker: webworker1 ,
				items: [{
					xtype: 'textarea' ,
					id: 'taWebWorker1Log'
				}]
			} , {
				xtype: 'workerpanel' ,
				title: 'Web Worker #2' ,
				worker: webworker2 ,
				items: [{
					xtype: 'textarea' ,
					id: 'taWebWorker2Log'
				}]
			}]
		}]
	});
});
