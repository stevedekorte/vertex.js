/*
Date.prototype.setSlotsIfAbsent(
{
	timestampString: function()
	{
		
	},
	
	simpleFormat :function() 
	{
		var d = this;
		var ds = d.getFullYear() + " ";
		ds = ds + d.getMonth().toString().alignRight(2, "0") + " ";
		ds = ds + d.getDay().toString().alignRight(2, "0") + ".";
		ds = ds + d.getHours().toString().alignRight(2, "0") + ":";
		ds = ds + d.getMinutes().toString().alignRight(2, "0") + ":";
		ds = ds + d.getSeconds().toString().alignRight(2, "0") + ":";
		ds = ds + d.getMilliseconds().toString().alignRight(2, "0") + ":";
		return ds;
	}
});
*/
