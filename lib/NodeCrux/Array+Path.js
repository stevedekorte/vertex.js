var path = require("path");

Object_shallowCopyFrom_(Array.prototype, {
	asPath: function()
	{
		return path.join.apply(path, this);
	}
});