/**
 * @class Ext.ux.WebWorkerManager
 * @author Vincenzo Ferrari <wilk3ert@gmail.com>
 * @singleton
 * 
 * Manager of Ext.ux.WebWorker
 * 
 * This singleton provide some useful functions to use for many webworkers.
 *
 *     var ww1 = Ext.create ('Ext.ux.WebWorker', {
 *       file: 'myWorker.js'
 *     });
 *     
 *     Ext.ux.WebWorkerManager.register (ww1);
 *     
 *     var blob = [
 *       'onmessage = function (msg) {' ,
 *       '	if (msg.event === "system shutdown") {' ,
 *       '		var res = {' ,
 *       '			event: "stop" ,' ,
 *       '			data: "Computation of worker 2 terminates correctly in 15h13m20s."' ,
 *       '		};' ,
 *       '		postMessage (res);' ,
 *       '	}' ,
 *       '}'
 *     ].join ('');
 *     
 *     var ww2 = Ext.create ('Ext.ux.WebWorker', {
 *       blob: blob
 *     });
 *     
 *     Ext.ux.WebWorkerManager.register (ww2);
 *     
 *     var ww3 = Ext.create ('Ext.ux.WebWorker', {
 *     file: 'otherWorker.js'
 *     });
 *     
 *     Ext.ux.WebWorkerManager.register (ww3);
 *     
 *     Ext.ux.WebWorkerManager.listen ('stop', function (ww, data) {
 *       Ext.Msg.show ({
 *         title: 'Worker stopped' ,
 *         msg: 'Log of the computation: ' + data ,
 *         icon: Ext.Msg.INFO ,
 *         buttons: Ext.Msg.OK
 *       });
 *     });
 *     
 *     // This will handled by everyone
 *     Ext.ux.WebWorkerManager.broadcast ('system shutdown', 'BROADCAST: the system will shutdown in few minutes.');
 *     
 *     Ext.ux.WebWorkerManager.stopAll ();
 *     
 *     Ext.ux.WebWorkerManager.unregister (ww1);
 *     Ext.ux.WebWorkerManager.unregister (ww2);
 *     Ext.ux.WebWorkerManager.unregister (ww3);
 */
Ext.define ('Ext.ux.WebWorkerManager', {
	singleton: true ,
	
	/**
	 * @property {Ext.util.HashMap} wsList
	 * @private
	 */
	wwList: Ext.create ('Ext.util.HashMap') ,
	
	/**
	 * @method register
	 * Registers one or more Ext.ux.WebWorker
	 * @param {Ext.ux.WebWorker/Ext.ux.WebWorker[]} webworkers WebWorkers to register. Could be only one.
	 */
	register: function (webworkers) {
		var me = this;
		
		if (Ext.isObject (webworkers)) webworkers = [webworkers];
		
		Ext.each (webworkers, function (webworker) {
			me.wwList.add (webworker.id, webworker);
		});
	} ,
	
	/**
	 * @method unregister
	 * Unregisters one or more Ext.ux.WebWorker
	 * @param {Ext.ux.WebWorker/Ext.ux.WebWorker[]} webworkers WebWorkers to unregister
	 */
	unregister: function (webworkers) {
		var me = this;
		
		if (Ext.isObject (webworkers)) webworkers = [webworkers];
		
		Ext.each (webworkers, function (webworker) {
			if (me.wwList.containsKey (webworker.id)) me.wwList.removeAtKey (webworker.id);
		});
	} ,
	
	/**
	 * @method contains
	 * Checks if a webworker is already registered or not
	 * @param {Ext.ux.WebWorker} webworker The WebWorker to find
	 * @return {Boolean} True if the webworker is already registered, False otherwise
	 */
	contains: function (webworker) {
		return this.wwList.containsKey (webworker.id);
	} ,
	
	/**
	 * @method get
	 * Retrieves a registered webworker by its id
	 * @param {String} id The id of the webworker to search
	 * @return {Ext.ux.WebWorker} The webworker or undefined
	 */
	get: function (id) {
		return this.wwList.get (id);
	} ,
	
	/**
	 * @method getExcept
	 * Retrieves registered webworkers except the input
	 * @param {Ext.ux.WebWorker/Ext.ux.WebWorker[]} webworkers WebWorkers to exclude
	 * @return {Ext.util.HashMap} Registered webworkers except the input
	 * @private
	 */
	getExcept: function (webworkers) {
		if (Ext.isObject (webworkers)) webworkers = [webworkers];
		
		var list = this.wwList.clone ();
		
		Ext.each (webworkers, function (webworker) {
			list.removeAtKey (webworker.id);
		});
		
		return list;
	} ,
	
	/**
	 * @method each
	 * Executes a function for each registered webwork
	 * @param {Function} fn The function to execute
	 */
	each: function (fn) {
		this.wwList.each (function (id, webworker, len) {
			fn (webworker);
		});
	} ,
	
	/**
	 * @method stopAll
	 * Stops any registered webworker
	 */
	stopAll: function () {
		var me = this;
		
		me.wwList.each (function (id, webworker, len) {
			webworker.stop ();
			me.unregister (webworker);
		});
	} ,
	
	/**
	 * @method listen
	 * Adds an handler for events given to each registered webworker
	 * @param {String/String[]} events Events to listen
	 * @param {Function} handler The events' handler
	 */
	listen: function (events, handler) {
		if (Ext.isString (events)) events = [events];
		
		this.wwList.each (function (id, webworker, len) {
			Ext.each (events, function (event) {
				webworker.on (event, handler);
			});
		});
	} ,
	
	/**
	 * @method listenExcept
	 * Adds an handler for events given to each registered webworker, except webworkers given
	 * @param {String/String[]} events Events to listen
	 * @param {Ext.ux.WebWorker/Ext.ux.WebWorker[]} webworkers WebWorkers to exclude
	 * @param {Function} handler The events' handler
	 */
	listenExcept: function (events, webworkers, handler) {
		if (Ext.isString (events)) events = [events];
		
		this.getExcept(webworkers).each (function (id, webworker, len) {
			Ext.each (events, function (event) {
				webworker.on (event, handler);
			});
		});
	} ,
	
	/**
	 * @method multicast
	 * Sends a message to each webworker, except those specified
	 * @param {Ext.ux.WebWorker/Ext.ux.WebWorker[]} webworkers An array of webworkers to take off the communication
	 * @param {String} event The event to raise
	 * @param {String/Object} data The data to send
	 */
	multicast: function (webworkers, event, data) {
		this.getExcept(webworkers).each (function (id, webworker, len) {
			if (Ext.isEmpty (data)) webworker.send (event);
			else webworker.send (event, data)
		});
	} ,
	
	/**
	 * @method broadcast
	 * Sends a message to each webworker
	 * @param {String} event The event to raise
	 * @param {String/Object} data The data to send
	 */
	broadcast: function (event, data) {
		this.multicast ([], event, data);
	}
});
