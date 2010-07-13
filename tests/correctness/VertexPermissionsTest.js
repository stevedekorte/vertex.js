var sys = require('sys');
var http = require('http');
var fs = require('fs');

require('../UnitTest');
require("../../lib/lib");
require("../VertexProcess");
require("../../client/VertexClient");

var testPort = 8123;

VertexPermissionsTest = UnitTest.newSlots({
	protoType: "VertexTest",
	activeTests: 0
}).setSlots({
	init: function()
	{
		this._vc = VertexClient.clone().setPort(testPort);
		this._vertexProcess = VertexProcess.clone().setPort(testPort).setDelegate(this).launch();
		//this.test();
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
		sys.print("VertexPermissionsTest:\n");
		var username = "flynn";
		var password = "reindeerfloatilla";
		
		this._vc.createUser(username, password);
		this._vc.setUsername(username);
		this._vc.setPassword(password);
		this._vc.mk("foo");
		this._vc.mwrite("foo", "user", username);
		this._vc.mwrite("foo", "mode", "rwx------");
		var self = this;
		sys.print("  create user ");
		this._vc.send(function() { self.verifyCreateAndTestValidWrite() });
	},
	
	verifyCreateAndTestValidWrite: function(results)
	{
		//writeln("\nresults1 = " + JSON.stringify(this._vc.results()) + "");
		assert(this._vc.results().isEqual([null,null,null,null,null]));
		sys.print("OK\n");
		var self = this;
		sys.print("  valid write ");
		this._vc.mwrite("foo", "a", "1").send(function() { self.verifyValidWriteAndAttemptInvalidMWrite() });
	},
	
	verifyValidWriteAndAttemptInvalidMWrite: function(results)
	{
		//writeln("results2 = '" + JSON.stringify(this._vc.results()) + "'");
		assert(this._vc.results().isEqual([null]));
		sys.print("OK\n");

		this._vc.setPassword("wrongpassword");
		var self = this;
		sys.print("  invalid write ");
		//this._vc.mk("foo/a").send(function() { self.verifyInvalidMWrite() });
		this._vc.mwrite("foo", "a", "1").send(function() { self.verifyInvalidMWrite() });
	},
	
	verifyInvalidMWrite: function(results)
	{
		//writeln("results3 = '" + JSON.stringify(this._vc.results()) + "'");
		assert(typeof(this._vc.results()) == 'object');
		sys.print("OK\n");

		//this._vc.mwrite("foo", "user", username).send(function() { self.test2() });
		if (this._vertexProcess) { this._vertexProcess.kill(); }
	},
	
	didExit: function(proc)
	{
	}


}).clone()

