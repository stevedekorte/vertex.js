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
	
	start: function()
	{
		var lastTime = this._throttleTimes[this.url().host()];
		
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
	
	justStart: function()
	{
		if(this._debug)
		{
			writeln("start\t", this.urlString());
		}

		this._throttleTimes[this.url().host()] = (new Date).getTime();
		
		var self = this;
		
		var port = this.url().port() || 80;
		this.generateHeaders();
		var client = http.createClient(port, this.url().host());
		client.on("error", function(e)
		{
			self.sendDelegates("httpRequestError", e);
		});
		var request = client.request(this.httpMethod().toUpperCase(), this.url().resource(), this.headers());
		request.on("error", function(e){
			self.sendDelegates("httpRequestError", e);
		});
		request.end(this.body(), 'utf8');
		
		request.on('response', function(response){
			response.on("error", function(e)
			{
				self.setError(e);
				self.httpRequestError(self, e);
			});
			self.setResponse(HttpResponse.clone().setHeaders(response.headers).setStatusCode(response.statusCode));
			response.on('data', function(chunk){
				self.response().setBody(self._response.body() + chunk);
			});
			
			response.on('end', function(){
//writeln(self.response().body());
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