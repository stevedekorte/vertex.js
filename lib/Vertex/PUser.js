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
	
	description: function()
	{
		return "username:" + this._username + " password:" + this._password + " valid:" + this.isValid();
	},
	
	clear: function()
	{
		this.setUsername(null);
		this.setPassword(null);
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
		return this;
	},
	
	groupNames: function()
	{
		return []; //this._pdb.nodeAtPathComponents(["_internal", "user", this.username()]).group().slotNames();
	},
	
	isValid: function()
	{
		var correctPassword = null;
		
		var pathComp = ["_internal", "users", this._username, "private", "password"];
		writeln("path: " + JSON.stringify(pathComp))
		//try
		//{
			var passwordNode = this._pdb.rootPNode().nodeAtPathComponents(pathComp);
			if (!passwordNode) return false;
			correctPassword = passwordNode.mread("data");
			writeln("correctPassword: " + correctPassword);
			if (correctPassword == this._password) return true;
		/*
		}
		catch(e)
		{
			writeln(e)
		}
		*/
		return false;
	},
	
	isReadableByUser: function(user)
	{
		return this.permissions().isReadableByUser(user);
	},

	isWritableByUser: function(user)
	{
		return this.permissions().isWritableByUser(user);
	}	
})
