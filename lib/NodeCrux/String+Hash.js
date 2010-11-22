require('joose');
require('joosex-namespace-depended');
require('hash');

Object_shallowCopyFrom_(String.prototype, {
	md5: function()
	{
		return Hash.md5(this);
	}
});