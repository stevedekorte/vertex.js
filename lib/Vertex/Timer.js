Timer = Proto.clone().newSlots({
	protoType: "Timer",
	dt: .020,
	callback: null
}).setSlots({
	setCallback: function(aCallback)
	{
		var wasRunning = this._intervalId;
		
		if(wasRunning)
		{
			this.stop();
		}
		
		this._callback = aCallback;
		
		if(wasRunning)
		{
			this.start();
		}
		
		return this;
	},
	
	start: function()
	{
		if(!this._intervalId)
		{
			this._intervalId = setInterval(this._callback, this._dt * 1000);
		}
		
		return this;
	},
	
	stop: function()
	{
		if (this._intervalId)
		{
			clearInterval(this._intervalId);
			this._intervalId = null;
		}
		
		return this;
	}
})