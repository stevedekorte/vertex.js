var http = require('http');
var fs = require('fs');

PUser = Proto.clone().newSlots({
	protoType: "PUser",
	pdb: null,
	username: null,
	password: null
}).setSlots({
	init: function()
	{

		return this;
	},
	
	setCookieHeader: function(header)
	{
		var d = {};

        header.split(";").forEach( 
			function(kv) 
			{
				var parts = kv.split("=");
				var name =  (parts[0] ? parts[0].trim() : '');
				var value = (parts[1] ? parts[1].trim() : '');
				d[name] = value;
        	}
		);

		//writeln("username = " + d["username"]);
		//writeln("password = " + d["password"]);
		this.setUsername(d["username"]);
		this.setPassword(d["password"]);
	},
	
	groupNames: function()
	{
		return []; //this._pdb.nodeAtPath("_internal/user/" + this.username()).group().slotNames();
	}

})
