var url = require("url");
var querystring = require("querystring");

Url = Proto.clone().newSlots({
	path: null
}).setSlots({
	parse: function(urlString)
	{
		var parts = url.parse(urlString);
		this.setPath(decodeURI(parts.pathname));
		//this.setPath(encodeURI("/foo bar/baz"));
		return this;
	}
});