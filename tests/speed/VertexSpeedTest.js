require("../../lib/lib");
require("../VertexProcess");
require("./AbProcess");
require("./NodeBench");


TestRequest = Proto.clone().newSlots({
	protoType: "TestRequest",
	requestItems: null,
	expectedResponseItems: null,
	responseItems: null,
	testName: "?",
	vertexProcess: null,
	delegate: null
}).setSlots({
	
	doesMatch: function()
	{
		return this.expectedResponseItems().compare(this.responseItems());
	},
	
	gotResponse: function(response)
	{
		this.setResponseItems(JSON.parse(response._data))
		sys.print("  " + this.testName())
		if(this.doesMatch())
		{
			writeln(" OK")
		}
		else
		{
			var r = this.responseItems();
			throw new Error("response:\n\n" + JSON.stringify(r));
		}
		this.delegate().didFinish(this);
	},

	send: function()
	{
		var self = this;
		var body = JSON.stringify(this.requestItems())
		var httpClient = http.createClient(8123, '127.0.0.1');
		var request = httpClient.request('GET', '/', 
			{
				'host': '127.0.0.1',
				"Content-Type": "application/json-request",
			    "Content-Length": Buffer.byteLength(body.toString(), "utf8")
				//"Cookie": "user=guest; password=guest;"
			});
			

		request.addListener('response', 
			function (response) 
			{
				request.response = response;
				response.request = request;
				response.setEncoding('utf8');
				response._data = "";
				response.addListener('data', function (d) { response._data = response._data + d; });
				response.addListener('end', function () { self.gotResponse(response); });
			}
		);
		
		request.write(body, 'utf8');
		request.end();
	}
})


VertexSpeedTest = Proto.clone().newSlots({
	protoType: "VertexSpeedTest",
	vertexProcess: VertexProcess.clone(),
	testQueue: null
}).setSlots({
	run: function()
	{
		this._testQueue = [];

		//var AbProcess = NodeBench;
		//AbProcess.setConcurrency(1);
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mk", "foo"], ["sync", 0]]')
				.setDescription("mk requests/second [synced]")
		)
	
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mk", "foo"]]')
				.setDescription("mk requests/second [unsynced]")
		)
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mk", "f1"], ["mk", "f2"], ["mk", "f3"], ["mk", "f4"], ["mk", "f5"], ["mk", "f6"], ["mk", "f7"], ["mk", "f8"], ["mk", "f9"], ["mk", "f10"]]')
				.setDescription("mk (10 pack) requests/second [unsynced]\n")
				.setMultiplier(10)
		)
		
		/*
		var post = []
		for (var i = 0; i < 1024; i ++)
		{
			post.push(["mk", "f1"])
		}
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData(JSON.stringify(post))
				.setDescription("mk (1024 pack) requests/second [unsynced]\n")
				.setMultiplier(1024)
		)
		*/

		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["link", "", "f2", "f1"], ["sync", 0]]')
				.setDescription("link requests/second [synced]")
		)
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["link", "", "f2", "f1"]]')
				.setDescription("link requests/second [unsynced]")
		)

		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"], ["link", "", "f2", "f1"]]')
				.setDescription("link (10 pack) requests/second [unsynced]\n")
				.setMultiplier(10)
		)

			
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["ls", "foo"]]')
				.setDescription("ls requests/second\n")
		)
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mwrite", "foo", "data", "hello"], ["sync", 0]]')
				.setDescription("mwrite requests/second [synced]")
		)
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mwrite", "foo", "data", "hello"]]')
				.setDescription("mwrite requests/second [unsynced]")
		)
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"], ["mwrite", "foo", "data", "hello"]]')
				.setDescription("mwrite (10 pack) requests/second [unsynced]\n")
				.setMultiplier(10)
		)

		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mread", "data"]]')
				.setDescription("mreads requests/second")
		)
				
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mread", "data"],["mread", "data"],["mread", "data"],["mread", "data"],["mread", "data"],["mread", "data"],["mread", "data"],["mread", "data"],["mread", "data"],["mread", "data"]]')
				.setDescription("mreads (10 pack) requests/second\n")
				.setMultiplier(10)
		)
		
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["sfddfsfds"]]')
				.setDescription("invalid API methodName requests/second")
		)
	
		this._testQueue.push(
			AbProcess.clone().setDelegate(this)
				.setPostData('[["mk"]]')
				.setDescription("invalid API parameter requests/second\n")
		)
		
		writeln("VertexPerformance test (a crude test):")		
		if (process.argv[2] == "-noserver")
		{
			this.next();
		}
		else
		{
			this.vertexProcess().setDelegate(this).launch();
		}
	},
	
	next: function()
	{
		var ab = this._testQueue.shift()
		ab.launch();
	},
	
	didStart: function(proc)
	{
		if(proc == this.vertexProcess())
		{
			this.next()
		}
	},
	
	didExit: function(proc)
	{
		if(proc != this.vertexProcess())
		{
			if(proc.multiplier() != 1)
			{
				writeln("  ", proc.requestsPerSecond(), " (", proc.multiplier()*proc.requestsPerSecond(), " total ops) ", proc.description());
			}
			else
			{
				writeln("  ", proc.requestsPerSecond(), " ", proc.description());
			}
			
			if (this._testQueue.length == 0)
			{
				this.vertexProcess().kill();
			}
			else
			{
				this.next()
			}
		}
	}	
}).run();