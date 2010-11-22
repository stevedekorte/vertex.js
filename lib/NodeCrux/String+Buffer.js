Object_shallowCopyFrom_(String.prototype, {
	byteLength: function(encoding)
	{
		if(!encoding) encoding = 'utf8';
		return Buffer.byteLength(this.toString(), encoding)
	}
});