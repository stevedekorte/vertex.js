
PCursor = Proto.clone().newSlots({	
	protoType: "PCursor",
	pdb: null,
	cursor: null,
	prefix: null
}).setSlots({
	init: function()
	{
		this._cursor = null
	},

	cursor: function()
	{
		if (this._cursor == null) {
			this._cursor = this._pdb.newCursor()
		}
		return this._cursor
	},

	first: function()
	{
		this.cursor().jump(this._prefix)
	},

	jump: function(k)
	{
		this.cursor().jump(this._prefix + k)
	},

	next: function()
	{
		this.cursor().next()
	},

	nodeValue: function()
	{
		return this._pdb.nodeForPid(this.value())
	},

	prev: function()
	{
		this.cursor().prev()
	},

	out: function()
	{
		this.cursor().out()
	},


	key: function()
	{
		var k = this.cursor().key()
	
		if (k == null) { 
			return null
		}
	
		return k.after(this._prefix)
	},

	value: function()
	{
		return this.cursor().val()
	},

	description: function()
	{
		var s = ""
		this.first()
		while (this.key()) {
			s = s + "  '" + this.key() + "' . '" + this.value() + "'\n"
			this.next()
		}
		return s
	}
})
