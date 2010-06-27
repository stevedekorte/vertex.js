
PNodePermissions = Proto.clone().newSlots({	
	protoType: "PNodePermissions",
	node: null,
	user: null,
	group: null,
	mode: null,
	
	userCanRead: null,
	userCanWrite: null,
	userCanExecute: null,

	groupCanRead: null,
	groupCanWrite: null,
	groupCanExecute: null,
	
	otherCanRead: null,
	otherCanWrite: null,
	otherCanExecute: null
}).setSlots({
	description: function()
	{
		return "user:" + this._user + " group:" + this._group + " mode:" + this._mode;
	},
	
	read: function()
	{
		this._user  = this._node.mread("_user");
		this._group = this._node.mread("_group");
		this._mode  = this._node.mread("_mode");
		
		if(!this._mode)
		{
			this._mode = "rwxrwxrwx";
		}

		var a = this._mode;
		
		this._userCanRead     = true; //a.charAt(0) == 'r';
		this._userCanWrite    = true; //a.charAt(1) == 'w';
		this._userCanExecute  = a.charAt(2) == 'x';
		
		this._groupCanRead    = a.charAt(3) == 'r';
		this._groupCanWrite   = a.charAt(4) == 'w';
		this._groupCanExecute = a.charAt(5) == 'x';
		
		this._otherCanRead    = a.charAt(6) == 'r';
		this._otherCanWrite   = a.charAt(7) == 'w';
		this._otherCanExecute = a.charAt(8) == 'x';
	},
	
	updateAccess: function()
	{
		var s = "";
		
		if (this._userCanRead)     { s = s + "r"; } else { s = s + "-"; }
		if (this._userCanWrite)    { s = s + "w"; } else { s = s + "-"; }
		if (this._userCanExecute)  { s = s + "x"; } else { s = s + "-"; }
		
		if (this._groupCanRead)    { s = s + "r"; } else { s = s + "-"; }
		if (this._groupCanWrite)   { s = s + "w"; } else { s = s + "-"; }
		if (this._groupCanExecute) { s = s + "x"; } else { s = s + "-"; }
		
		if (this._otherCanRead)    { s = s + "r"; } else { s = s + "-"; }
		if (this._otherCanWrite)   { s = s + "w"; } else { s = s + "-"; }
		if (this._otherCanExecute) { s = s + "x"; } else { s = s + "-"; }
		
		this._mode = s;
	},
	
	write: function()
	{
		this._node.mwrite("_user", this._user);
		this._node.mwrite("_group", this._group);
		this.updateAccess();
		this._node.mwrite("_mode", this._mode);
	},
	
	isReadableByUser: function(user)
	{
		if (this._otherCanRead) { return true; }
		if (this._user == null) { return true; }
		if (!user.isValid()) { return false; }
		if (this._user == user.username()) { return true; }
		if (user.groupNames().detect(this._group) && this._groupCanRead) { return true; }
		return false;
	},
	
	isWritableByUser: function(user)
	{
		if (this._otherCanWrite) { return true; }
		if (this._user == null) { return true; }
		//writeln(user.username() + ".isValid() = " + user.isValid());
		if (!user.isValid()) { return false; }
		if (this._user == user.username()) { return true; }
		if (user.groupNames().detect(this._group) && this._groupCanWrite) { return true; }
		return false;
	}
})

