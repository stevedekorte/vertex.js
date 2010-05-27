var sys = require('sys');
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
	delegate: null
}).setSlots({
	launch: function()
	{
		//writeln("AbProcess launch()")
		var ab = spawn('ab', [
			'-n', new String(this.numberOfRequests()), 
			'-c', new String(this.concurrency()), 
			'-T', this.requestType(), 
			'-p', this.postData(), 
			this.url()]);

		var self = this;
		this.setOutput("")

		ab.stdout.addListener('data', function (data) { self._output = self._output + data });
		//ab.stderr.addListener('data', function (data) { sys.puts(data); });
		ab.stderr.addListener('data', function (data) { });

		ab.addListener('exit', function (code) { 
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

