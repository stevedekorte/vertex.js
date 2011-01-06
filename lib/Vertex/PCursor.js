
PCursor = Proto.clone().newSlots({	
	protoType: "PCursor",
	pdb: null,
	cursor: null,
	prefix: null,
	node: null // optional
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
		return this._cursor
	},

	first: function()
	{
		this._cursor.jump(this._prefix)
		return this;
	},
	
	last: function() //TODO: Don't assume prefix format
	{
		this._cursor.jump(this.prefix().removeSuffix("/") + "0"); // 0 is the first character after slash
		this.prev();
		return this;
	},

	jump: function(k)
	{
		this._cursor.jump(this._prefix + k);
		return this;
	},

	next: function()
	{
		this._cursor.next();
		return this;
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
	},
	
	count: function()
	{
		var count = 0;
		this.first();
		while(this.key())
		{
			count = count + 1;
			this.next();
		}
		return count;
	},
	
	/*
	keys: function()
	{
		this.first()
		var keys = [];
		while(this.key())
		{
			keys.push(this.key());
			this.next();
		}
		return keys;
	},
	*/
	
	values: function()
	{
		this.first()
		var values = [];
		while(this.key())
		{
			values.push(this.value());
			this.next();
		}
		return values;
	},
	
	keys: function(first, max, reverse) 
	{
		var count = 0;
		this.first();
		
		if(first) 
		{
			this.jump(first);
		}
		
		var keys = [];
		while(this.key())
		{
			keys.push(this.key());
			count ++;
			if(max != null && count >= max) break;
			if(reverse)
			{
				this.prev();
			}
			else
			{
				this.next();
			}
		}
		return keys;
	},
})
