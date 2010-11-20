var util = require('util');

Log = Proto.clone().newSlots({
	exception: null
}).setSlots({
	writeln: function()
	{
		var args = Arguments_asArray(arguments);
		//var now = new Date;
		//args.prepend(now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "." + now.getMilliseconds())
		util.log(args.join(""));
		if(this.exception())
		{
			writeln(this.exception().stack);
			this.setException(null);
		}
		return this;
	}
})