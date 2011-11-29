var http = require('http');

HttpRequest = Delegator.clone().setProtoType("HttpRequest").newSlots({
	url: null,
	httpMethod: "get",
	response: null,
	headers: null,
	cookies: null,
	body: null,
	urlString: null,
	throttlePeriod: 0, //seconds
	debug: false,
	didComplete: false,
	maxConcurrency: 0,
	timeout: 0, //seconds
	proxyHost: null,
	proxyPort: null
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
	_inProgressCount: 0,
	_startQueue: [],
	
	start: function()
	{
		if(this.maxConcurrency() > 0 && HttpRequest._inProgressCount >= this.maxConcurrency())
		{
//Log.writeln("Queueing due to max concurrency (", HttpRequest._inProgressCount, " vs. ", this.maxConcurrency(), ": ", this.urlString());
			this._startQueue.append(this);
			return this;
		}
		
		if(this.didComplete())
		{
			throw new Error("Request already completed");
		}
		
		this.setDidComplete(false);
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
		this.setDidComplete(true);
//Log.writeln("HttpRequest complete: ", this.uniqueId(), ": ", this.urlString());
		delete HttpRequest._inProgress[this.uniqueId()];
		HttpRequest._inProgressCount --;
		if(this._nativeClient)
		{
			//this._nativeClient.destroy();
			this._nativeClient = null;
		}
		
		if(this._nativeRequest)
		{
			//this._nativeRequest.destroy();
			this._nativeRequest = null;
		}
		
		if(this._nativeResponse)
		{
			//this._nativeResponse.destroy();
			this._nativeResponse = null;
		}
		
		clearTimeout(this._timeoutTimeout);
		
		var waiting = HttpRequest._startQueue.removeFirst();
		if(waiting)
		{
			waiting.start();
		}
		
		return this;
	},
	
	sendError: function(e)
	{
		if(!this.didComplete())
		{
			this.complete();
			this.sendDelegates("httpRequestError", e);
		}
	},
	
	sendCompleted: function()
	{
		if(!this.didComplete())
		{
			this.complete();
			this.sendDelegates("httpRequestCompleted");
		}
	},
	
	patchEmitter: function(emitter, tag)
	{
		var self = this;
		emitter._emit = emitter.emit;
		emitter.emit = function(name)
		{
			Log.writeln("HttpRequest request ", tag, ": ", self.uniqueId(), ": ",  name);
			return this._emit.apply(this, arguments);
		}
		
		return emitter;
	},
	
	justStart: function()
	{
//Log.writeln("HttpRequest start: ", this.uniqueId(), ": ",  this.urlString());
		
		HttpRequest._inProgressCount ++;
//Log.writeln(HttpRequest._inProgressCount);
		HttpRequest._inProgress[this.uniqueId()] = this;

		HttpRequest._throttleTimes[this.url().host()] = (new Date).getTime();
		
		var self = this;
		
		var clientPort = this.proxyPort() || this.url().port() || 80;
		var clientHost = this.proxyHost() || this.url().host();
		this.generateHeaders();
		
		if(this.timeout())
		{
			self._timeoutTimeout = setTimeout(function(){
				self.sendError(new Error("timeout"));
			}, this.timeout() * 1000);
		}
		
		var client = http.createClient(clientPort, clientHost);
		this._nativeClient = client;
//this.patchEmitter(client, "client");
		client.on("error", function(e)
		{
			self.sendError(e);
		});
		client.on("upgrade", function(e){
			self.sendError(new Error("can't handle client upgrade"));
		});
		client.on("continue", function(e){
			self.sendError(new Error("can't handle client continue"));
		});
		client.on("close", function(e){
			self.sendCompleted();
		});
		
		if(this.proxyHost())
		{
			var resource = this.urlString();
		}
		else
		{
			var resource = this.url().resource();
		}
		var request = client.request(this.httpMethod().toUpperCase(), resource, this.headers());
		this._nativeRequest = request;
//this.patchEmitter(request, "request");
		request.on("error", function(e){
			self.sendError(e);
		});
		request.on("close", function()
		{
			self.sendError(new Error("request closed"));
		});
		request.end(this.body(), 'utf8');
		
		this.setResponse(HttpResponse.clone());
		
		request.on('response', function(response){
			self._nativeResponse = response;
//self.patchEmitter(response, "response");
			self.response().setHeaders(response.headers).setStatusCode(response.statusCode);
			response.on("error", function(e)
			{
				self.sendError(e);
			});
			response.on("close", function()
			{
				self.sendError(new Error("response closed"));
			});
			response.on('data', function(chunk){
				self.response().setBody(self._response.body() + chunk);
			});
			
			response.on('end', function(){
//Log.writeln("HttpRequest response end: ", self.uniqueId());
//writeln(self.response().body());
				self.sendCompleted();
			});
		});
		return this;
	},
	
	cancel: function()
	{
		this.complete();
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
		this._headers = {};
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