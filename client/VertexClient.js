require("../lib/lib");
var sys = require('sys');
var	http = require('http');
	
VertexClient = Proto.clone().newSlots({
	protoType: "VertexClient",
	host: "127.0.0.1",
	port: 8123,
	requests: null,
	response: null,
	results: null,
	description: null,
	username: null,
	password: null,
	debug: false
}).setSlots({
	init: function()
	{
		this._requests = [];
	},
	
	clear: function()
	{
		this._requests = [];
		return this;
	},
	
	pushRequest: function(r)
	{
		// remove trailing nulls
		for(var i = r.length - 1; i > 0; i --)
		{
			if(r[i] == null) 
			{
				r.pop();
			}
			else
			{
				break;
			}
		}
		
		this._requests.push(r);
	},
	
	mk: function(path, optionalType, optionalData)
	{
		this.pushRequest(["mk", path, optionalType, optionalData]);
		return this;
	},
	
	link: function(destPath, slotName, sourcePath)
	{
		this.pushRequest(["link", destPath, slotName, sourcePath]);
		return this;
	},
	
	ls: function(path, optionalStart, optionalReverse, optionalCount, optionalSelectExpression)
	{
		this.pushRequest(["ls", path, optionalStart, optionalReverse, optionalCount, optionalSelectExpression]);
		return this;
	},
	
	rm: function(path, slotName)
	{
		this.pushRequest(["rm", path, slotName]);
		return this;
	},

	mwrite: function(path, name, value)
	{
		this.pushRequest(["mwrite", path, name, value]);
		return this;
	},

	mread: function(path, name)
	{
		this.pushRequest(["mread", path, name]);
		return this;
	},

	mls: function(path)
	{
		this.pushRequest(["ls", path]);
		return this;
	},

	mrm: function(path, name)
	{
		this.pushRequest(["mrm", path, name]);
		return this;
	},

	sync: function(dtInSeconds)
	{
		this.pushRequest(["sync", dtInSeconds]);
		return this;
	},
	
	vanish: function()
	{
		this.pushRequest(["vanish"]);
		return this;
	},
	
	createUser: function(username, password)
	{
		//this.mk("_internal/users/" + username);
		this.mk("_internal/users/" + username + "/private/password", "String", password);
		this.sync();
		return this;
	},
	
	send: function(callback)
	{
		this._results = null;
		this._body = JSON.stringify(this._requests);
		this._callback = callback;
		this.justSend();
		return this;
	},
	
	gotResponse: function(response)
	{
		//writeln("gotResponse " + response);
		//this._delegate.didFinish(this);
		
		try
		{
			this._results = JSON.parse(response._data);
		}
		catch(e)
		{
			//writeln("ERROR PARSING");
			this._results = "ERROR PARSING '" + response.body + "'";
		}
		
		if(this._callback) 
		{
			//writeln("this._results = " + this._results);
			this._callback(); //(this, this._results); why doesn't this work?
		}
	},

	justSend: function()
	{
		var self = this;
		var httpClient = http.createClient(this._port, this._host);
		var headers = {
				'Host': this._host,
				"Content-Type": "application/json-request",
			    "Content-Length": Buffer.byteLength(this._body.toString(), "utf8")
		};
		
		if(this._username)
		{
			headers["Cookie"] = "ignoreAddons=true&username=" + this._username + ";password=" + this._password + ";";
		}
					
		//writeln("this._username = " + this._username);
		//writeln("sending headers = ", JSON.stringify(headers));
		
		var request = httpClient.request('GET', '/', headers);

		request.addListener('response', 
			function (response) 
			{
				request.response = response;
				response.request = request;
				response.setEncoding('utf8');
				response._data = "";
				response.addListener('data', function (chunk) { response._data = response._data + chunk; });
				response.addListener('end', function () {  self.gotResponse(response); });
			}
		);
		
		
		if (this.debug())
		{
			writeln(this._host + ":" + this._port + " sending [" + headers["Cookie"] + "] " + this._body);
		}
		
		
		request.write(this._body, 'utf8');
		request.end();
		this._request = request;
		this._sentRequests = this._requests;
		this._requests = [];
	}
});
