var sys = require('sys'),
	http = require('http'),
	parseUrl = require('url').parse;

NodeBench = Proto.clone().newSlots({
	protoType: "NodeBench",
	numberOfRequests: 1000,
	concurrency: 10,
	requestType: 'application/json-request',
	url: 'http://127.0.0.1:8123/',
	description: "",
	postData: null,
	delegate: null,
	multiplier: 1,
	requestsPerSecond: null
}).setSlots({
	launch: function()
	{
		this._completedRequests = 0;
		this._startedRequests = 0;
		
		var urlParts = parseUrl(this._url);
		this._href = urlParts.href;
		this._host = urlParts.hostname;
		
		this._client = http.createClient(new Number(urlParts.port), this._host);
		
		this._startTime = new Date().getTime();
		this.fillRequests();
	},
	
	fillRequests: function()
	{
		for(var i = 0; i < this._concurrency && i < this._numberOfRequests; i ++)
		{
			this.startRequest();
		}
	},
	
	startRequest: function()
	{
		this._startedRequests ++;
		
		var self = this;
		var request = this._client.request('POST',
			this._href,
			{
				'Host': this._host,
				'Content-Type': this._requestType,
				'Content-Length': this._postData.length
			}
		);
		
		request.addListener('response', function(response)
		{
			response.addListener('end', function () {
				self.requestEnded();
			});
		});
		
		request.write(this._postData);
		
		request.end();
	},
	
	requestEnded: function()
	{
		this._completedRequests ++;
		
		if(this._completedRequests >= this._numberOfRequests)
		{
			this.end();
		}
		else if(this._startedRequests < this._numberOfRequests)
		{
			this.startRequest();
		}
	},
	
	end: function()
	{
		this.setRequestsPerSecond(Math.round(this._numberOfRequests * 1000 / (new Date().getTime() - this._startTime)));
		
		if(this._delegate)
		{
			this._delegate.didExit(this);
		}
	}
});