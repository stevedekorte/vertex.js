
Object_shallowCopyFrom_(String.prototype, {
	md5_joost: function()
	{
		require('joose');
		require('joosex-namespace-depended');
		require('hash');		
		return Hash.md5(this);
	},
	
	md5: function()
	{
		var crypto = require("crypto");
		var hash = crypto.createHash("md5");
		hash.update(this);
		return hash.digest("hex");
	}	
});