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
	
	base64Url: function(length)
	{
		var str = this.md5("base64").replace("+", "-").replace("/", "_").before("=");
		if(length)
		{
			str = str.slice(0, length);
		}
		return str;
	}
});