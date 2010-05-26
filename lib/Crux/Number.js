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
	}
});