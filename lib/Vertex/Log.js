Log = Proto.clone().setSlots({
	writeln: function()
	{
		var args = Arguments_asArray(arguments);
		var now = new Date;
		args.prepend(now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "." + now.getMilliseconds())
		writeln(args.join("\t"));
		return this;
	}
})