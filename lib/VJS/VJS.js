VJS = Delegator.clone().newSlots({
	protoType: "VJS",
	host: "localhost",
	port: 8000,
	started: false,
	ops: null,
	request: null,
	result: null
}).setSlots({
	begin: function()
	{
		if(!this.started())
		{
			this.setOps([]);
			this.setStarted(true);
		}
		
		return this;
	},
	
	abort: function()
	{
		this.setStarted(false);
		
		return this;
	},
	
	commit: function()
	{
		if(this.started())
		{
			var req = HttpRequest.clone();
			req.setUrlString("http://" + this.host() + ":" + this.port() + "/");
			req.setHttpMethod("POST");
			req.addDelegate(this);
			req.setBody(JSON.stringify(this.ops()));
			req.setContentType("application/json-request");
			req.setCookie("ignoreAddons", "true");
			req.start();
			
			this.setRequest(req);
			this.setStarted(false);
		}
		
		return this;
	},
	
	httpRequestCompleted: function(req)
	{
		/*
		writeln(req.body(), "\n");
		writeln(req.response().body());
		writeln("-------------------");
		*/
		
		try
		{
			this.setResult(JSON.parse(req.response().body()));
			this.sendDelegates("committed");
		}
		catch(e)
		{
			this.sendDelegates("commitFailed", e);
		}
	},
	
	httpRequestError: function(req, e)
	{
		this.sendDelegates("commitFailed", e);
	},
	
	doOp: function(opName, args)
	{
		var started = this.started();
		if(!started) this.begin();

		var op = [opName];
		
		for (var i = 0; i < args.length; i ++)
		{
			op.append(args[i]);
		}
		
		this.ops().append(op);
		
		if(!started) this.commit();
		
		return this;
	},
	
	mk: function(){ return this.doOp("mk", arguments); },
	link: function(){ return this.doOp("link", arguments); },
	ls: function(){ return this.doOp("ls", arguments); },
	obj: function(){ return this.doOp("obj", arguments); },
	rm: function(){ return this.doOp("rm", arguments); },
	mwrite: function(){ return this.doOp("mwrite", arguments); },
	mread: function(){ return this.doOp("mread", arguments); },
	mls: function(){ return this.doOp("mls", arguments); },
	mrm: function(){ return this.doOp("mrm", arguments); },
	sync: function(){ return this.doOp("sync", arguments); }
});

Object_shallowCopyFrom_(String.prototype,{
	vjsType: function() { return "String" },
	asVjsData: function() { return this; }
});

Object_shallowCopyFrom_(Number.prototype,{
	vjsType: function() { return "Number" },
	asVjsData: function() { return this.toString(); }
});

Object_shallowCopyFrom_(Date.prototype,{
	vjsType: function() { return "Date" },
	asVjsData: function() { return this.getTime().toString(); }
});

require("./VJSObject");
require("./VJSIndex");