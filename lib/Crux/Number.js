Number.prototype.setSlots(
{
	cssString: function() 
	{
		return this.toString();
	},

	milliseconds: function()
	{
		return this;
	},

	repeat: function(callback)
	{
		for(var i = 0; i < this; i++)
		{
			callback(i);
		}
		return this;
	},

	map: function()
	{
		var a = [];
		for(var i = 0; i < this; i ++)
		{
			a.push(i);
		}
		return Array.prototype.map.apply(a, arguments);
	},

	isEven: function()
	{
		return this % 2 == 0;
	},
	
	asNumber: function()
	{
		return this;
	},
	
	seconds: function()
	{
		return this * 1000;
	},
	
	second: function()
	{
		return this.seconds();
	},
	
	minutes: function()
	{
		return 60 * this.seconds();
	},
	
	minute: function()
	{
		return this.minutes();
	},
	
	hours: function()
	{
		return 60 * this.minutes();
	},
	
	hour: function()
	{
		return this.hours();
	},
	
	days: function()
	{
		return 24 * this.hours();
	},
	
	day: function()
	{
		return this.days();
	},
	
	ago: function(date)
	{
		date = date || new Date();
		return date.getTime() - this;
	},
	
	after: function(date)
	{
		date = date || new Date();
		return date.getTime() + this;
	}
});