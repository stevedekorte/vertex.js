var crypto = require("crypto");

Object_shallowCopyFrom_(String.prototype, {
	md5: function(encoding)
	{
		if(!encoding)
		{
			encoding = "hex";
		}
		
		var hash = crypto.createHash("md5");
		hash.update(this);
		return hash.digest(encoding);
	},
	
	base64: function()
	{
		var encode = require('base64').encode;
		var Buffer = require('buffer').Buffer;
		
		return encode(new Buffer(this + ""));
	},
	
	base64Url: function()
	{
		return this.base64().replace("+", "-").replace("/", "_").before("=");
	}
});