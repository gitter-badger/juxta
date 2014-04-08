/*global history */

/**
 * @class Abstract window class
 * @abstract
 *
 * @param {jQuery|String} element
 * @param {Object} options
 */
Juxta.Window = function(element, options) {

	/**
	 * @type {Object}
	 */
	this._settings = {
		closable: false,
		maximized: false
	};

	$.extend(this._settings, options);


	/**
	 * @type {jQuery}
	 */
	this._container = $(element);


	/**
	 * @type {jQuery}
	 */
	this._applicationsContainer = $('#applications');


	/**
	 * @type {Object}
	 */
	this._menu = this.find('.application-menu');


	/**
	 * @type {jQuery}
	 */
	this._status = this.find('.application-status');


	if (this._settings.closable) {
		this.find('.application-close').on('click', function() { history.back(); }).show();
	} else {
		this.find('.application-close').hide();
	}

	this._applySettings(this._settings);

};

Juxta.Lib.extend(Juxta.Window, Juxta.Events);


/**
 * Apply settings to application
 *
 * @param {Object} options
 * @param {Object} variables
 * @return {Juxta.Window}
 */
Juxta.Window.prototype._applySettings = function(options, variables) {
	//
	var header = this.find('.application-header'),
		text = '';

	if ($.isPlainObject(options.header)) {

		text = options.header.title ;

		if (options.header.name) {
			text += ' <a>' + options.header.name + '</a>';
		}
		if (options.header.from !== undefined) {
			text += ' <span class="application-header-from">from <a>' + variables.from + '</a></span>';
		}

	} else {
		text = options.header;
	}

	header.html(text);

	this._setMenu(options.menu, variables);

	return this;
};


/**
 * Set application menu
 *
 * @param {Object} menu
 * @param {Object} variables
 * @return {Juxta.Window}
 */
Juxta.Window.prototype._setMenu = function(menu, variables) {
	//
	this._menu.empty();

	if ($.isPlainObject(menu)) {
		$.each(menu, (function(title, item) {
			//
			var link = $('<a>').html(title).attr('disabled', true),
				href,
				action,
				name;

			if (item && typeof item == 'object') {
				if (item.href) {
					href= item.href;
				}
				if (item.click && typeof item.click == 'function') {
					action = item.click;
				}
				if (item.name) {
					name = item.name;
				}

			} else if (typeof item == 'function') {
				action = item;

			} else if (item) {
				href = item;
			}

			if (href) {
				link.attr('href', $.template(href, variables)).attr('disabled', false);
			}
			if (action) {
				link.on('click', (function (event) { action.call(this, event, variables); }).bind(this)).attr('disabled', false);
			}
			if (name) {
				link.attr('name', name);
			}

			this._menu.append(link);

		}).bind(this));
	}

	return this;
};


/**
 * Show application
 *
 * @param {Object} options
 * @param {Object} variables
 * @return {Juxta.Window}
 */
Juxta.Window.prototype.show = function(options, variables) {
	//
	if (options) {
		this._applySettings($.extend({}, this._settings, options), variables);
	}

	if (!this.is(':visible')) {
		this._applicationsContainer.find('.application').hide();
		this._container.show();
	}

	if (this._settings.maximized) {
		this.maximize();

	} else {
		this.restore();
	}

	return this;
};


/**
 * Show application and trigger event 'ready'
 *
 * @return {Juxta.Window}
 */
Juxta.Window.prototype.ready = function() {
	//
	return this.trigger('ready').show();
};


/**
 * Hide application
 *
 * @return {Juxta.Window}
 */
Juxta.Window.prototype.hide = function() {
	this._container.hide();

	return this;
};



/**
 * Maximize window
 *
 * @return {Juxta.Applcation}
 */
Juxta.Window.prototype.maximize = function() {
	//
	this._applicationsContainer.addClass('_maximized');
	this.trigger('maximize');

	return this;
};


/**
 * Restore maximized application to standard size
 *
 * @return {Juxta.Window}
 */
Juxta.Window.prototype.restore = function() {
	//
	this._applicationsContainer.removeClass('_maximized');
	this.trigger('restore');

	return this;
};


/**
 * Check container element against a selector
 *
 * @return {Object}
 * @todo Move to abstract Juxta.Container
 */
Juxta.Window.prototype.is = function() {
	return $.fn.is.apply(this._container, arguments);
};


/**
 * Find elements by selectors in current container
 *
 * @return {Object}
 * @todo Move to abstract Juxta.Container
 */
Juxta.Window.prototype.find = function() {
	return $.fn.find.apply(this._container, arguments);
};