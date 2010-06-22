require("../../lib/lib");
require("../../client/VertexClient");
require("../VertexProcess");
var sys = require('sys');
var	http = require('http');


VertexSpeedTest = Proto.clone().newSlots({
	protoType: "VertexSpeedTest",
	vertexProcess: VertexProcess.clone(),
	vertexClient: VertexClient.clone(),
	testQueue: null
}).setSlots({
	run: function()
	{
		this.vertexProcess().setDelegate(this).launch();
		//this.didStart();
		//this._testQueue = [];

		return;
		
/*
		var self = this;
		this._testQueue.push(
			vertexClient
				.setRequests([["mk", new String(i)], ["sync", 0]])
				.setDescription("mk requests/second [synced]")
				.send(function (r) { self.didFinish(r); }
		)
				
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
		*/

		writeln("VertexPerformance test (a crude test):")		
	},
	
	
	didStart: function()
	{
		this._vclient = VertexClient.clone();
		this._t1 = new Date();		
		this.unsyncMk(0);
	},
	
	show: function(message, count)
	{
		var t2 = new Date();
		writeln(message, " ", Math.floor(count / ((t2 - this._t1)/1000)), "/sec");
		this._t1 = t2;
	},
	
	unsyncMk: function(i)
	{
		var self = this;
		var max = 1000;
				
		if(i > max) 
		{
			this.show("  unsync mk", max)
			this.syncMk(0);
			return
		}
		else
		{
			this._vclient.mk(new String(i)).sync(0).send(function () { self.unsyncMk(i+1); });
		}
	},
	
	syncMk: function(i)
	{
		var self = this;
		var max = 1000;
		
		if(i > max) 
		{
			this.show("  sync mk", max)
			this.groupMk(0);
			return
		}
		else
		{
			this._vclient.mk(new String(i)).send(function () { self.syncMk(i+1); });
		}
	},
	
	groupMk: function(i)
	{
		var self = this;
		var max = 200;
		
		if(i > max) 
		{
			this.show("  group mk", max*10)
			this.didExit();
			return
		}
		else
		{
			for(var n = 0; n < 10; n++)
			{
				this._vclient.mk(i + "." + n)
			}
			this._vclient.sync(0).send(function () { self.groupMk(i+1); });
		}
	},
	
	didExit: function(proc)
	{
		try
		{
			this.vertexProcess().kill();
		}
		catch (e)
		{
		}
	}	
}).run();