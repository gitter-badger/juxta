/*global document, window, setInterval */

/**
 * Juxta 0.0.1
 *
 * Copyright (c) 2010-2011 Alexey Golovnya
 * Licensed under the MIT license
 * http://juxta.ru
 */

/**
 * @class Juxta base application
 */
var Juxta = function() {

	var that = this;

	/**
	 * Appliaction state
	 * @type {String}
	 */
	this.state = null;


	/**
	 * Cache
	 * @type Juxta.Cache
	 */
	this.cache = new Juxta.Cache();


	/**
	 * @type {Juxta.Connection}
	 */
	this.connection = new Juxta.Connection();


	/**
	 * @type {Juxta.Sidebar}
	 */
	this.sidebar = new Juxta.Sidebar();


	/**
	 * Request/response
	 * @type Juxta.Request
	 */
	this.request = new Juxta.Request(this.connection, this.cache, {
		request: {
			beforeSend: function() {
				that.loading();
			},
			complete: function() {
				that.loading(false);
			},
			error: function(xhr, status) {
				if (status == 'parsererror') {
					that.error('Answer parsing error');
				} else {
					that.error(xhr.status + ' ' + xhr.statusText);
				}
			}
		},
		response: {
			connectionError: function(response) {
				that.error(response.error);
				that.auth.show();
			},
			sessionNotFound: function() {
				window.location.hash = '#login';
			},
			error: function(response) {
				that.error(response.error);
			},
			unknowStatus: function() {
				that.error('Response with unknow status recived');
			}
		}
	});


	/**
	 * Notification messages
	 * @type {Juxta.Notification}
	 */
	this.notification = new Juxta.Notification();


	/**
	 * Server explorer
	 * @type {Juxta.Explorer}
	 */
	this.explorer = new Juxta.Explorer('#explorer', this.request);


	/**
	 * Table data browser
	 * @type {Juxta.Browser}
	 */
	this.browser = new Juxta.Browser('#data-browser', this.request);


	/**
	 * Table editor
	 * @type {Juxta.Table}
	 */
	this.table = new Juxta.Table('#table', this.request);


	/**
	 * Server inofrmation
	 * @type {Juxta.Server}
	 */
	this.server = new Juxta.Server('#server-info', this.request);


	/**
	 * Backup and restore
	 * @type {Juxta.BackupRestore}
	 */
	this.exchange = new Juxta.BackupRestore('#backup-restore');


	/**
	 * Connect to server form
	 * @type {Juxta.Auth}
	 */
	this.auth = new Juxta.Auth('#login', this.request);


	/**
	 * Float box
	 * @type {Juxta.Modal}
	 */
	this.messageBox = new Juxta.Modal('#message');


	/**
	 * Dummy appliaction
	 * @type {Juxta.Dummy}
	 */
	this.dummy = new Juxta.Dummy('#dummy');


	// Change sidebar state and window title on connection
	this.connection.on('change', function() {
		that.sidebar.path(that.connection.get());
		that.setTitle(that.connection.get());
	});

	// Show Juxta when application ready to show
	$.each([this.explorer, this.server, this.browser, this.table], function(i, application) {
		application.on('ready', $.proxy(that.show, that));
	});

	//
	this.auth
		.on('before-show', $.proxy(this.hide, this))
		.on('login', function(connection) {
			that.connection.set(connection);
			that.state = null;
			window.location.hash = '#databases';
		})
		.on('logout', function() {
			that.cache.flush();
			that.setTitle();
			window.location.hash = '#login';
		});

	// Notifications
	this.auth.on('notify', function(message, type, options) {
		if (type === 'error') {
			that.error(message, options);
		} else if (type === 'loading') {
			that.loading(message, options);
		} else {
			that.notify(message, options);
		}
	});

	//
	$('#header a[name=about]').bind('click', function() {
		that.about();
		return false;
	});

	//
	$('#header .sql a').bind('click', function() {
		if (that.browser.is(':visible') && that.browser.mode == 'browse') {
			that.browser.toggleEditor();
			return false;
		}
	});

	// @todo Remove this from here
	$('.float-box').draggable({scroll: false, handle: 'h3'});

	// @todo Remove this from here
	$(document.body).bind('click', function() {
		$('.context:visible').trigger('hide').hide();
	});

	this.run();

};

Juxta.prototype = {

	/**
	 * Run application
	 * @return {Juxta}
	 */
	run: function() {
		//
		if (window.location.hash === '') {
			window.location.hash = 'databases';
		}

		setInterval($.proxy(this.route, this), 200);

		return this;
	},


	/**
	 *
	 */
	route: function() {
		//
		var hash = window.location.hash.replace(/#/g, ''),
			params = hash.split('/'),
			action = params.pop();

		if (hash != this.state) {
			switch (action) {
				case 'databases':
				case 'processlist':
				case 'users':
					this.explore({show: action});
					break;
				case 'status':
				case 'status-full':
				case 'variables':
				case 'charsets':
				case 'engines':
					this.info({show: action});
					break;
				case 'backup':
					this.sidebar.highlight('backup');
					this.exchange.show();
					break;
				case 'restore':
					this.sidebar.highlight('restore');
					this.dummy.show({header: 'Restore'});
					break;
				case 'login':
					this.auth.show();
					break;
				//
				case 'tables':
				case 'views':
				case 'routines':
				case 'triggers':
					this.explore({show: action, from: params[0]});
					break;
				//
				case 'browse':
					this.browser.browse({browse: params[1], from: params[0]});
					break;
				case 'sql':
					this.browser.sql({db: params[0]});
					break;
				case 'columns':
					this.sidebar.highlight('columns', {'database': params[0], 'table': params[1]});
					this.table.edit({table: params[1], from: params[0]});
					break;
				case 'foreign':
					this.sidebar.highlight('foreign', {'database': params[0], 'table': params[1]});
					this.dummy.show();
					break;
				case 'options':
					this.sidebar.highlight('options', {'database': params[0], 'table': params[1]});
					this.dummy.show({header: 'Options'});
					break;
				case 'maintenance':
					this.sidebar.highlight('maintenance', {'database': params[0], 'table': params[1]});
					this.dummy.show({header: {title: 'Maintenance Table', name: params[1]}});
					break;
				case 'flush':
					this.cache.flush();
					window.location = '#databases';
					break;
				default:
					window.location = '#databases';
			}
			this.state = hash;
		}
	},


	/**
	 * Change window title
	 * @param {Object} connection
	 * @return {Juxta}
	 */
	setTitle: function(connection) {
		var title = 'Juxta';
		if (connection) {
			title = connection.user + '@' +  connection.host + ' - ' + title;
		}
		window.document.title = title;

		return this;
	},


	/**
	 *
	 */
	show: function() {
		$('#sidebar:not(.minimized)').slideDown(250);
		$('.float-box').hide();
		if ($('#applications').not(':visible')) {
			$('#applications').fadeIn(250);
			$('#header h1, #header ul').fadeIn(250);
		}
	},


	/**
	 *
	 */
	hide: function() {
		$('#header h1, #header ul, #sidebar, #applications, .float-box').hide();
	},


	/**
	 *
	 */
	explore: function(params) {
		if (params.from) {
			this.sidebar.highlight(params.show, {'database': params.from});
			return this.explorer.explore(params);
		} else {
			this.sidebar.highlight(params.show);
			return this.explorer.explore(params);
		}
	},


	/**
	 *
	 */
	drop: function(params) {
		this.explorer.drop(params);
	},


	/**
	 *
	 */
	kill: function(params) {
		this.explorer.kill(params);
	},

	/**
	 *
	 */
	info: function(params) {
		this.sidebar.highlight('status');
		this.server.info(params);
	},


	/**
	 * Notifications shortcuts
	 */
	notify: function(message, options) {
		return this.notification.show(message, options);
	},


	/**
	 *
	 */
	loading: function(message, options) {
		return this.notification.loading(message, options);
	},


	/**
	 *
	 */
	error: function(message, options) {
		return this.notification.show(message, $.extend({}, {type: 'error', hide: false, fast: true}, options));
	},


	/**
	 *
	 */
	message: function(message, options) {
		this.messageBox.show(options, message);
	},


	/**
	 *
	 */
	about: function() {
		this.message($('#about').html(), {title: ''});
	}

};

$(document).ready(function() {
	window.Jux = new Juxta();
});