var util = require('util');

Log = Proto.clone().newSlots({
	exception: null
}).setSlots({
	writeln: function()
	{
		util.log(Arguments_asArray(arguments).join(""));
		var exception = this.exception();
		if(exception)
		{
			writeln(exception.stack || exception.message || exception);
			this.setException(null);
		}
		return this;
	}
})