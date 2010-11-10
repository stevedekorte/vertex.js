var sys = require('sys');
var fs = require('fs');
var spawn = require('child_process').spawn;
require("../../lib/lib");

AbProcess = Proto.clone().newSlots({
	protoType: "AbProcess",
	numberOfRequests: 1000,
	concurrency: 10,
	requestType: 'application/json-request',
	postData: 'data.txt',
	url: 'http://127.0.0.1:8123/',
	requestsPerSecond: null,
	output: "",
	delegate: null,
	description: "",
	postData: null,
	multiplier: 1
}).setSlots({
	launch: function()
	{
		if (this.postData())
		{
			var self = this;
			fs.writeFile('data.txt', this.postData(), 
				function (e) 
				{
			  		if (e) throw e;
			  		self.launch2();
				}
			);
		}
		else
		{
			this.launch2();
		}
	},
	
	launch2: function()
	{	
		//writeln("AbProcess launch()")
		var args = 	[
				'-n', new String(this.numberOfRequests()), 
				'-c', new String(this.concurrency()), 
				'-T', this.requestType(), 
				'-p', 'data.txt', 
				this.url()];
		var ab = spawn('ab', args);

		var self = this;
		//writeln("ab " + args.join(" "))
		this.setOutput("")

		ab.stdout.addListener('data', function (data) { self._output = self._output + data });
		//ab.stderr.addListener('data', function (data) { sys.puts(data); });
		ab.stderr.addListener('data', function (data) { });

		ab.addListener('exit', function (code) { 
			writeln("self._output = '", self._output, "'");
			var rps = self._output.after("Requests per second:").before("[").trim();
			self.setRequestsPerSecond(Math.floor(new Number(rps)));
			//sys.puts("requestsPerSecond: " + rps);
			if (self.delegate())
			{
				self.delegate().didExit(self);
			}
		});
	}
});

