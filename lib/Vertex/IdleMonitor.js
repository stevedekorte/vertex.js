IdleMonitor = Proto.clone().newSlots({
	protoType: "IdleMonitor",
	dt: 2,
	vertex: null,
	callback: null
}).setSlots({
	start: function()
	{
		var self = this;
		this._vertex.timer().setCallback(function()
		{
			if(new Date().getTime() - self._vertex.lastReqTime() > self._dt * 1000)
			{
				if(self._callback)
				{
					self._callback();
				}
			}
		}).start();
		return this;
	},
	
	stop: function()
	{
		this._vertex.timer().stop();
		return this;
	}
});