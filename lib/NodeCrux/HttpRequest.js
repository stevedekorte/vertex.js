var http = require('http');

HttpRequest = Delegator.clone().setProtoType("HttpRequest").newSlots({
	url: null,
	httpMethod: "get",
	response: null,
	headers: null,
	cookies: null,
	body: null,
	urlString: null,
	throttlePeriod: 0,
	debug: false
}).setSlots({
	init: function()
	{
		Delegator.init.call(this);
		
		this.setUrl(Url.clone());
		this.setHeaders({});
		this.setCookies({});
		this.setBody("");
	},
	
	setUrlString :function(urlString)
	{
		this._urlString = urlString;
		this.url().parse(urlString);
		return this;
	},
	
	generateHeaders: function()
	{
		this.setHeader("Host", this.url().host());
		this.setHeader("Content-Length", this.body().byteLength());
		if(!Object_isEmpty(this.cookies()))
		{
			this.setHeader("Cookie", Object_mapSlots_(this.cookies(), function(k, v){ return k + "=" + v }).join("&")); //TODO properly escape this
		}
	},
	
	_throttleTimes: {},
	
	_inProgress: {},
	
	start: function()
	{
		var lastTime = HttpRequest._throttleTimes[this.url().host()];
		
		if (lastTime)
		{
			var diff = (lastTime + this.throttlePeriod() * 1000) - (new Date).getTime();
			
			
			if(diff > 0)
			{
				var self = this;
				setTimeout(function() { self.start() }, diff);
			}
			else
			{
				this.justStart();
			}
		}
		else
		{
			this.justStart();
		}
		
		return this;
	},
	
	complete: function()
	{
		Log.writeln("HttpRequest complete: ", this.uniqueId(), ": ", this.urlString());
		delete HttpRequest._inProgress[this.uniqueId()];
	},
	
	justStart: function()
	{
		Log.writeln("HttpRequest start: ", this.uniqueId(), ": ",  this.urlString());
		
		HttpRequest._inProgress[this.uniqueId()] = this;

		HttpRequest._throttleTimes[this.url().host()] = (new Date).getTime();
		
		var self = this;
		
		var port = this.url().port() || 80;
		this.generateHeaders();
		
		var client = http.createClient(port, this.url().host());
client._emit = client.emit;
client.emit = function(name)
{
	Log.writeln("HttpRequest client emit: ", self.uniqueId(), ": ",  name);
	return this._emit.apply(this, arguments);
}

		client.on("error", function(e)
		{
			self.complete();
			self.sendDelegates("httpRequestError", e);
		});
		client.on("upgrade", function(e){
			writeln("HttpClient upgrade ... exiting");
			process.exit();
		});
		client.on("continue", function(e){
			writeln("HttpClient continue ... exiting");
			process.exit();
		});
		var request = client.request(this.httpMethod().toUpperCase(), this.url().resource(), this.headers());
request._emit = request.emit;
request.emit = function(name)
{
	Log.writeln("HttpRequest request emit: ", self.uniqueId(), ": ",  name);
	return this._emit.apply(this, arguments);
}
		request.on("error", function(e){
			self.complete();
			self.sendDelegates("httpRequestError", e);
		});
		request.on("close", function()
		{
			self.complete();
			Log.writeln("HttpRequest request close: ", self.uniqueId());
			self.sendDelegates("httpRequestError", new Error("request closed"));
		});
		request.end(this.body(), 'utf8');
		
		request.on('response', function(response){
response._emit = response.emit;
response.emit = function(name)
{
	Log.writeln("HttpRequest response emit: ", self.uniqueId(), ": ",  name);
	return this._emit.apply(this, arguments);
}
			response.on("error", function(e)
			{
				self.complete();
				self.sendDelegates("httpRequestError", e);
			});
			response.on("close", function()
			{
				Log.writeln("HttpRequest response close: ", self.uniqueId());
				self.complete();
				self.sendDelegates("httpRequestError", new Error("response closed"));
			});
			self.setResponse(HttpResponse.clone().setHeaders(response.headers).setStatusCode(response.statusCode));
			response.on('data', function(chunk){
				self.response().setBody(self._response.body() + chunk);
			});
			
			response.on('end', function(){
				Log.writeln("HttpRequest response end: ", self.uniqueId());
//writeln(self.response().body());
				self.complete();
				self.sendDelegates("httpRequestCompleted");
			});
		});
		return this;
	},
	
	setHeader: function(name, value)
	{
		this.headers()[name] = value;
		return this;
	},
	
	setContentType: function(contentType)
	{
		return this.setHeader("Content-Type", contentType);
	},
	
	setCookie: function(name, value)
	{
		this.cookies()[name] = value;
	}
});


//HttpResponse

HttpResponse = Proto.clone().setProtoType("HttpResponse").newSlots({
	statusCode: null,
	headers: null,
	body: null
}).setSlots({
	init: function()
	{
		this._body = "";
	}
})

//String+HttpRequest

Object_shallowCopyFrom_(String.prototype,{
	getWithDelegate: function(aDelegate)
	{
		return HttpRequest.clone().setUrlString(this).setHttpMethod("GET").addDelegate(aDelegate).start();
	}
});