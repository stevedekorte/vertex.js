var sys = require('sys');
var http = require('http');
var fs = require('fs');

require('../UnitTest');
require("../../lib/lib");
require("../VertexProcess");
require("../../client/VertexClient");

var testPort = 8123;

VertexTest = UnitTest.newSlots({
	protoType: "VertexTest",
	activeTests: 0
}).setSlots({
	init: function()
	{
		this._vc = VertexClient.clone().setPort(testPort);
		//this._vertexProcess = VertexProcess.clone().setPort(testPort).setDelegate(this).launch();
		this.test();
	},
	
	didStart: function(proc)
	{
		this.test();
	},
	
	test: function()
	{
		var self = this;
		this._vc.vanish().send(function() { self.createUserAndNode() });
	},
	
	createUserAndNode: function()
	{
		var username = "flynn";
		var password = "reindeerfloatilla";
		
		this._vc.createUser(username, password);
		this._vc.setUsername(username);
		this._vc.setPassword(password);
		this._vc.mk("foo");
		this._vc.mwrite("foo", "user", username);
		this._vc.mwrite("foo", "access", "rwx------");
		var self = this;
		this._vc.send(function() { self.verifyCreateAndTestValidWrite() });
	},
	
	verifyCreateAndTestValidWrite: function(results)
	{
		writeln("\nresults1 = " + JSON.stringify(this._vc.results()) + "");
		assert(this._vc.results().isEqual([null,null,null,null,null]));
		var self = this;
		this._vc.mwrite("foo", "a", "1").send(function() { self.verifyValidWriteAndAttemptInvalidWrite() });
	},
	
	verifyValidWriteAndAttemptInvalidWrite: function(results)
	{
		writeln("results2 = '" + JSON.stringify(this._vc.results()) + "'");
		assert(this._vc.results().isEqual([null]));

		this._vc.setPassword("wrongpassword")
		var self = this;
		this._vc.mk("foo/a").send(function() { self.verifyInvalidWrite() });
		//this._vc.mwrite("foo", "a", "1").send(function() { self.verifyInvalidWrite() });
	},
	
	verifyInvalidWrite: function(results)
	{
		writeln("results3 = '" + JSON.stringify(this._vc.results()) + "'");
		//writeln("type = '" + typeof(this._vc.results()) + "'");
		assert(typeof(this._vc.results()) == 'object');

		//this._vc.mwrite("foo", "user", username).send(function() { self.test2() });
		if (this._vertexProcess) { this._vertexProcess.kill(); }
	},
	
	didExit: function(proc)
	{
	}


}).clone()

