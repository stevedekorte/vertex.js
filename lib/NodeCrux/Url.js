var url = require("url");
var querystring = require("querystring");

Url = Proto.clone().newSlots({
	host: null,
	port: null,
	path: null,
	resource: null,
	queryParams: null
}).setSlots({
	parse: function(urlString)
	{
		var parts = url.parse(urlString, true);
		
		//writeln(JSON.stringify(parts));
		
		this.setHost(parts.hostname);
		this.setPort(parts.port);
		this.setPath(decodeURI(parts.pathname));
		this.setResource(this.path() + (parts.search || ""));
		this.setQueryParams(parts.query || {});
		
		return this;
	}
});