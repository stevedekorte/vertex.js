Object_shallowCopyFrom_(Date.prototype,{
	ShortDayDescriptions: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	
	shortDayDesc: function()
	{
		return this.ShortDayDescriptions[this.getDay()];
	}
});