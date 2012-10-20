/**
 * @class Ext.ux.WebWorker
 * @author Vincenzo Ferrari <wilk3ert@gmail.com>
 *
 * Wrapper for HTML5 WebWorker
 * 
 * This class provide an interface for HTML5 WebWorker.
 *
 * <h1>Pure text communication</h1>
 * The communication is text-only, without objects or any other kind of data.
 *
 *     var webworker = Ext.create ('Ext.ux.WebWorker', {
 *       file: 'myWorker.js' ,
 *       listeners: {
 *         message: function (ww, message) {
 *           console.log ('A new message is arrived: ' + message);
 *         } ,
 *         error: function (ww, error) {
 *           Ext.Error.raise (error);
 *         }
 *       }
 *     });
 *
 * <h1>Pure event-driven communication</h1>
 * The communication is event-driven: an event and a String or Object are sent and the webworker handles different events.
 *
 *     var webworker = Ext.create ('Ext.ux.WebWorker', {
 *       file: 'myWorker.js' ,
 *       listeners: {
 *         message: function (ww, message) {
 *           ww.send ('parse', 'a string to parse');
 *           ww.send ('verify equation', {
 *             equation: 'x+y-z=10' ,
 *             x: 10 ,
 *             y: 5 ,
 *             z: 5
 *           });
 *         }
 *       }
 *     });
 *     
 *     // A 'terminate' event is sent from the worker (myWorker.js)
 *     // 'data' has 'log' and 'msg' fields
 *     webworker.on ('terminate', function (data) {
 *       console.log ('Log: ' + data.log);
 *       console.log ('Message: ' + data.msg);
 *     });
 *
 * <h1Mixed communication</h1>
 * The communication is mixed: it can handles text-only and event-driven communication.
 *
 *     var webworker = Ext.create ('Ext.ux.WebWorker', {
 *       file: 'myWorker.js' ,
 *       listeners: {
 *         message: function (ww, message) {
 *           console.log ('Text-only message arrived is: ' + message);
 *           
 *           ww.send ('parse', 'a string to parse');
 *           ww.send ('verify equation', {
 *             equation: 'x+y-z=10' ,
 *             x: 10 ,
 *             y: 5 ,
 *             z: 5
 *           });
 *         }
 *       }
 *     });
 *     
 *     // A 'terminate' event is sent from the worker (myWorker.js)
 *     // 'data' has 'log' and 'msg' fields
 *     webworker.on ('terminate', function (data) {
 *       console.log ('Log: ' + data.log);
 *       console.log ('Message: ' + data.msg);
 *     });
 */
Ext.define ('Ext.ux.WebWorker', {
	alias: 'widget.webworker' ,
	
	mixins: {
		observable: 'Ext.util.Observable'
	} ,
	
	config: {
		/**
		 * @cfg {String} blob Inline worker. Use only this or file.
		 */
		blob: '' ,
		
		/**
		 * @cfg {String} file A separated that contains the worker. Use only this or blob.
		 */
		file: '' ,
		
		/**
		 * @cfg {String} itemId A further id specified by the user.
		 */
		itemId: ''
	} ,
	
	/**
	 * Creates new WebWorker
	 * @param {Object} config The configuration options may be specified as follows:
	 * 
	 *     var config = {
	 *       file: 'myWorker.js'
	 *     };
	 *     
	 *     or
	 *
	 *     var config = {
	 *       blob: 'onmessage = function (e) {postMessage ("A message from worker: + " e.data);}'
	 *     };
	 *
	 *     var ww = Ext.create ('Ext.ux.WebWorker', config);
	 *
	 * @return {Ext.ux.WebWorker} An instance of Ext.ux.WebWorker or null if an error occurred.
	 */
	constructor: function (cfg) {
		var me = this;
		
		me.initConfig (cfg);
		me.mixins.observable.constructor.call (me, cfg);
		
		me.addEvents (
			/**
			 * @event error
			 * Fires after an error occured
			 * @param {Ext.ux.WebWorker} this The webworker
			 * @param {Object} error The error object to display
			 */
			'error' ,
			
			/**
			 * @event message
			 * Fires after a message is arrived from the worker.
			 * @param {Ext.ux.WebWorker} this The webworker
			 * @param {String/Object} message The message arrived
			 */ 
			'message'
		);
		
		try {
			// Makes inline worker
			if (Ext.isEmpty (me.file)) {
				var BlobBuilder = window.MozBlobBuilder	|| window.WebKitBlobBuilder;
				var winURL = window.URL || window.webkitURL;
				
				var bb = new BlobBuilder ();
				bb.append (me.blob);
				var blob = bb.getBlob ();
				var inlineFile = winURL.createObjectURL (blob);
				
				me.worker = new Worker (inlineFile);
			}
			// Uses file
			else {
				me.worker = new Worker (me.file);
			}
			
			me.id = Ext.id ();
			
			me.worker.onmessage = function (message) {
				// Message event is always sent
				me.fireEvent ('message', me, message.data);
				
				/*
					message.data : object
					msg.event : event to raise
					msg.data : data to handle
				*/
				if (Ext.isObject (message.data)) me.fireEvent (message.data.event, me, message.data.data);
			}
			
			me.worker.onerror = function (message) {
				me.fireEvent ('error', me, message);
			}
		}
		catch (err) {
			Ext.Error.raise (err);
			
			return null;
		}
		
		return me;
	} ,
	
	/**
	 * @method send
	 * Sends data. If there's only the first parameter (events), it sends it as a normal string, otherwise as an object
	 * @param {String/String[]} events Events that have to be handled by the worker
	 * @param {String/Object} data The data to send
	 */
	send: function (events, data) {
		var me = this;
		
		// Treats it as a normal message
		if (arguments.length === 1) {
			if (Ext.isString (events)) me.worker.postMessage (events);
			else Ext.Error.raise ('String expected!');
		}
		// Treats it as an event-driven message
		else if (arguments.length >= 2) {
			if (Ext.isString (events)) events = [events];
			
			Ext.each (events, function (event) {
				var msg = {
					event: event ,
					data: data
				};
				
				me.worker.postMessage (msg);
			});
		}
	} ,
	
	/**
	 * @method stop
	 * Stops the webworker
	 */
	stop: function () {
		this.worker.terminate ();
	}
});
