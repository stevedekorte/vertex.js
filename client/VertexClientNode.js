require("../lib/lib");

//  UNDER CONSTRUCTION: THIS OBJECT IS NOT YET USED 

VertexClientNode = Proto.clone().newSlots({
	protoType: "VertexClientNode",
	client: null,
	path: "",
	mcache: null
}).setSlots({
	init: function()
	{
		//this._mcache = {};
	},
	
	newNode: function()
	{
		return VertexClientNode.clone.setClient(this._client);
	},
	
	mk: function(k, optionalType, optionalData)
	{
		var newPath = this._path + "/" + k;
		this._client.mk(newPath, optionalType, optionalData);
		return this.newNode().setPath(newPath);
	},
	
	link: function(slotName, otherNode)
	{
		this._client.link(this._path, slotName, otherNode.path());
		return this;
	},
	
	ls: function(optionalStart, optionalReverse, optionalCount, optionalSelectExpression)
	{
		this._client.rm(this._path, optionalStart, optionalReverse, optionalCount, optionalSelectExpression);
		return this;
	},
	
	rm: function(path, k)
	{
		this._client.rm(this._path, k);
		return this;
	},

	mread: function(k)
	{
		return this._client.mread(this._path, k);
	},
	
	mwrite: function(k, v)
	{
		this._client.mwrite(this._path, k, v);
		return this;
	},

	mls: function()
	{
		this._client.ls(this._path);
		return this;
	},

	mrm: function(k)
	{
		this._client.mrm(this._path, k);
		return this;
	},

	sync: function(dtInSeconds)
	{
		this._client.sync(dtInSeconds);
		return this;
	},
	
	vanish: function()
	{
		this._client.vanish();
		return this;
	},
	
	send: function(closure)
	{
		this._client.send();
		return this;
	},
	
	gotResponse: function(response)
	{
		if(this._callback) this._callback();
	}
});
