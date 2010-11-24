Object_shallowCopyFrom_(String.prototype, {
	md5: function()
	{
		var crypto = require("crypto");
		var hash = crypto.createHash("md5");
		hash.update(this);
		return hash.digest("hex");
	}	
});