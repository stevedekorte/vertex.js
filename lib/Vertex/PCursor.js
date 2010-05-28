
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
	
	setPdb: function(pdb)
	{
		this._pdb = pdb;
		this._cursor = this._pdb.newCursor();
		return this;
	},


	cursor: function()
	{
		/*
		if (this._cursor == null) 
		{
			this._cursor = this._pdb.newCursor()
		}
		*/

		return this._cursor
	},

	first: function()
	{
		//this._cursor.first()
		this._cursor.jump(this._prefix)
		//writeln("PCursor first key: " + this._cursor.key())
	},

	jump: function(k)
	{
		this._cursor.jump(this._prefix + k)
	},

	next: function()
	{
		this._cursor.next()
	},

	nodeValue: function()
	{
		return this._pdb.nodeForPid(this.value())
	},

	prev: function()
	{
		this._cursor.prev()
	},

	out: function()
	{
		this._cursor.out()
	},


	key: function()
	{
		var k = this._cursor.key()
	
		if (k == null) 
		{ 
			return null
		}
	
		return k.after(this._prefix)
	},

	value: function()
	{
		return this._cursor.val()
	},

	description: function()
	{
		var s = ""
		this.first()
		while (this.key()) 
		{
			s = s + "  '" + this.key() + "' . '" + this.value() + "'\n"
			this.next()
		}
		return s
	}
})
