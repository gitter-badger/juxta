/**
 * @class Data browser
 * @extends Juxta.Application
 * @param {jQuery|String} element
 * @param {Juxta.Request} request
 */
Juxta.Browser = function(element, request) {

	var that = this;

	Juxta.Application.prototype.constructor.call(this, element, {header: 'Browse', closable: true, maximized: true});

	/**
	 * Options
	 * @type {Object}
	 */
	this.options = {
		limit: 50
	}


	/**
	 * Client
	 * @type {Juxta.Request}
	 */
	this.request = request;


	/**
	 * Last request
	 * @type {jqXHR}
	 */
	this._lastRequest = null;


	/**
	 * @type {Number}
	 */
	this.total;


	/**
	 * Last request params
	 * @type {Object}
	 */
	this._lastQuery = {
		browse: null,
		from: null,
		limit: 30,
		offset: 0
	}


	/**
	 * @type {Juxta.TreeGrid}
	 */
	this.grid = new Juxta.Grid2(this.$application.find('.grid2'));


	$(this.grid).bind('change', function () {
		that.updateStatus();
	});

	$(window).bind('resize', {that: this}, this.stretch);

	$(this.grid).bind('scrollBottom', function() {
		//
		if (that.grid.count < that.total && that._lastRequest.isResolved()) {
			that.requestNextRows();
		}
	});

}

Juxta.Lib.extend(Juxta.Browser, Juxta.Application);

/**
 * Show explorer
 * @param {Object} options
 * @retrun {Juxta.Browser}
 */
Juxta.Browser.prototype.show = function(options) {
	Juxta.Application.prototype.show.apply(this, arguments);
	this.stretch();

	return this;
}


/**
 * Reset browser state
 * @return {Juxta.Browser}
 */
Juxta.Browser.prototype._reset = function () {
	this._lastQuery = null;
	this._lastQuery = {};
	this.total = null;
	this.grid.clear();

	return this;
}


/**
 * Stretch grid to window height
 * @param {Event} event
 */
Juxta.Browser.prototype.stretch = function(event) {
	var that = event && event.data.that || this;
	if (that.$application.is(':visible')) {
		that.grid.setHeight($('#applications').height() - that.$application.find('.grid2-body').position().top - that.$statusBar.height() - 24);
	}
}


/**
 * Browse a table
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Browser.prototype.browse = function(params) {
	//
	this._reset();

	this.show({
		header: {title: 'Browse', name: params.browse, from: params.from}
	});

	return this.requestBrowse(params);
}


/**
 * Request next rows
 * @return {jqXHR}
 */
Juxta.Browser.prototype.requestNextRows = function() {
	//
	var query = this._lastQuery;
	query.offset = query.offset + query.limit;

	return this.requestBrowse(query);
}


/**
 * Request data
 * @param {Object} params
 * @return {jqXHR}
 */
Juxta.Browser.prototype.requestBrowse = function(params) {
	var query = $.extend({}, params),
		options = {};

	var that= this;

	if (query.limit == undefined) {
		query.limit = this.options.limit;
	}
	if (query.offset === undefined) {
		query.offset = 0;
	}

	this._lastRequest = this.request.send($.extend(
		{},
		{
			action: query,
			context: this,
			success: function(response) {
				that.responseBrowse(response, query);
			}
		},
		this.settings,
		options
	));

	$.when(this._lastRequest).then(function() {
		if (!that.grid.vertScrollEnabled() && that.grid.count < that.total && that._lastRequest.isResolved()) {
			that.requestNextRows();
		}
	});

	return this._lastRequest;
}


/**
 * Response
 * @param {Object} response
 */
Juxta.Browser.prototype.responseBrowse = function(response, query) {
	//
	var that = this;

	that._lastQuery = query;
	this.total = response.total;

	var params = {
		columns: [],
		contextMenu: [
			{title: 'Delete', action: function() { console.log('Drop'); }},
			{title: 'Edit', action: function() { console.log('Edit');  }}
		],
		head: {}
	};

	$.each(response.columns, function(i, column) {
		params.columns.push({title: column[0], style: 'test'});
	});

	if (this.grid.prepared === false) {
		this.grid.prepare(params);
	}

	this.grid.fill(response.data);

	this.show();

	this.updateStatus();
}


/**
 * Change status bar text
 * @param {Object} response
 * @return {jqXHR}
 */
Juxta.Browser.prototype.updateStatus = function() {
	var status = '';
	if (this.grid.count) {
		if (this.grid.count < this.total) {
			status = this.grid.count + (this.grid.count == 1 ? ' row' : ' rows') + ' from ' + this.total;
		} else {
			status = this.grid.count + (this.grid.count == 1 ? ' row' : ' rows');
		}
	}

	if (status) {
		this.$statusBar.text(status);
	} else {
		this.$statusBar.text(status);
	}

	return this;
}
