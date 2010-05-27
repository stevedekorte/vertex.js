require('./UnitTest');
var sys = require('sys'), http = require('http');


/*
	TODO:
		- add tests for returning nulls for invalid paths
		- add tests for all optional args
*/


TestRequest = Proto.clone().newSlots({
	protoType: "TestRequest",
	requestItems: null,
	expectedResponseItems: null,
	responseItems: null,
	testName: "?"
}).setSlots({
	
	doesMatch: function()
	{
		return this.expectedResponseItems().compare(this.responseItems());
	},
	
	gotResponse: function(response)
	{
		this.setResponseItems(JSON.parse(response._data))
		writeln("  " + this.testName())
		if(this.doesMatch())
		{
			writeln("    OK")
		}
		else
		{
			var r = this.responseItems();
			writeln("\nerror: " + this.expectedResponseItems() + " != " + r + "\n");
			throw new Error("response:\n\n" + JSON.stringify(r))
		}
	},

	send: function()
	{
		var body = JSON.stringify(this.requestItems())
		//writeln("sending: ", body)
		var httpClient = http.createClient(8000, '127.0.0.1');
		var request = httpClient.request('GET', '/', 
			{
				'host': '127.0.0.1',
				"Content-Type": "application/json-request",
			    "Content-Length": body.length
			});
			
		var self = this;

		request.addListener('response', 
			function (response) 
			{
				request.response = response
				response.request = request
				response.setEncoding('utf8');
				response._data = ""

				response.addListener('data',
					function (chunk)
					{
						response._data = response._data + chunk;
					}
				);
				
				response.addListener('end', 
					function ()
					{
						self.gotResponse(response);
					}
				);
			}
		);
		
		//writeln("SENDING data:", body)
		request.write(body, 'utf8')
		request.end();
	}
})


VertexTest = UnitTest.newSlots({
	protoType: "VertexTest"
}).setSlots({
	
	sendTest: function(a, b, c)
	{
		TestRequest.clone().setTestName(a).setRequestItems(b).setExpectedResponseItems(c).send()
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
				["data", "size", "type"]
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
				["data", "size"]
			]
		)
	}
}).clone().runSilnet()

