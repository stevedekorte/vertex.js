var sys = require('sys');
var http = require('http');
var fs = require('fs');

require('../UnitTest');
require("../../lib/lib");
require("../VertexProcess");

/*
	TODO:
		- add tests for returning nulls for invalid paths
		- add tests for all optional args
*/

var testPort = 8123

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
		//writeln("gotResponse '",response._data, "'")
		this.setResponseItems(JSON.parse(response._data))
		sys.print("  " + this.testName())
		if(this.doesMatch())
		{
			writeln(" OK")
		}
		else
		{
			var r = this.responseItems();
			//writeln("\nerror: " + this.expectedResponseItems() + " != " + r + "\n");
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
			    "Content-Length": body.length
				//"Cookie": "user=flynn; password=raindeerfloatilla;"
			});
			

		request.addListener('response', 
			function (response) 
			{
				request.response = response;
				response.request = request;
				response.setEncoding('utf8');
				response._data = "";

				response.addListener('data',
					function (chunk)
					{
						//writeln("got data: ", chunk);
						response._data = response._data + chunk;
					}
				);
				
				response.addListener('end', 
					function ()
					{
						//writeln("end");
						self.gotResponse(response);
					}
				);
			}
		);
		
		request.write(body, 'utf8');
		request.end();
		//writeln("sent ", body);
	}
})

VertexTest = UnitTest.newSlots({
	protoType: "VertexTest",
	activeTests: 0
}).setSlots({
	
	sendTest: function(a, b, c)
	{
		//writeln("sending ", this._activeTests)
		this._activeTests = this._activeTests + 1;
		TestRequest.clone().setDelegate(this).setTestName(a).setRequestItems(b).setExpectedResponseItems(c).send();
	},
	
	didStart: function(proc)
	{
		//writeln("didStart");
		this.runSilent();
	},
	
	didExit: function(proc)
	{
		
	},
	
	didFinish: function(test)
	{
		//writeln("didFinish ", this._activeTests);
		this._activeTests = this._activeTests - 1;
		if(this._activeTests == 0)
		{
			//writeln("done");
			vertexProcess.kill();
		}
	},

	test_mk: function()
	{
		this.sendTest(
			"mk",
			[
				["vanish"], 
				["mk", "foo/bar"], 
				["ls", "foo"]
			],
			[
				null, 
				null, 
				["bar"]
			]
		);
	},

	test_link: function()
	{
		this.sendTest(
			"link",
			[
				["vanish"], 
				["mk", "foo/bar/a/b"],
				["mk", "foo/moo"],
				["link", "foo/moo", "a", "foo/bar/a"],
				["ls", "foo/moo/a"]
			],
			[
				null,
				null,
				null,
				null,
				["b"]
			]
		)		
	},
	
	test_ls: function()
	{
		this.sendTest(
			"ls",
			[
				["vanish"], 
				["mk", "foo/a"],
				["mk", "foo/b"],
				["mk", "foo/c"],
				["ls", "foo"]
			],
			[
				null,
				null,
				null,
				null,
				["a", "b", "c"]
			]
		)
	},

	test_mwrite_and_mread: function()
	{
		this.sendTest(
			"mwrite",
			[
				["vanish"], 
				["mk", "foo/name"],
				["mwrite", "foo/name", "type", "String"],
				["mwrite", "foo/name", "data", "Joe Blow"],
				["mread", "foo/name", "type"],
				["mread", "foo/name", "data"]
			],
			[
				null,
				null,
				null,
				null,
				"String",
				"Joe Blow"
			]
		)
	},

	test_mls: function()
	{
		this.sendTest(
			"mls",
			[
				["vanish"], 
				["mk", "foo/name"],
				["mwrite", "foo/name", "type", "String"],
				["mwrite", "foo/name", "data", "Joe Blow"],
				["mls", "foo/name"]
			],
			[
				null,
				null,
				null,
				null,
				["data", "type"]
			]
		)
		
		// need to add tests for options
	},

	test_mrm: function()
	{
		this.sendTest(
			"mrm",
			[
				["vanish"], 
				["mk", "foo/name"],
				["mwrite", "foo/name", "type", "String"],
				["mwrite", "foo/name", "data", "Joe Blow"],
				["mrm", "foo/name", "type"],
				["mls", "foo/name"]
			],
			[
				null,
				null,
				null,
				null,
				null,
				["data"]
			]
		)
	}
	/*
	
	test_permissions: function()
	{
		this.sendTest(
			"mrm",
			[
				["vanish"], 
				["mk", "foo/name"],
				["mwrite", "foo", "user", "flynn"],
				["mk", "_internal/users/flynn"],
				["mwrite", "_internal/users/flynn", "password", "raindeerfloatilla"],
				["mk", "foo/name"]
			],
			[
				null,
				null,
				null,
				null,
				null,
				["data"]
			]
		)
	}
	*/
})

if(true)
{
	var vt = VertexTest.clone();
	var vertexProcess = VertexProcess.clone().setPort(testPort).setDelegate(vt).launch();
}
else
{
	VertexTest.clone().runSilent();
}
