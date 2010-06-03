// Using text description of permissions until we have a way of natively storing numbers.

PNodePermissions = Proto.clone().newSlots({	
	protoType: "PNodePermissions",
	node: null,
	user: null,
	group: null,
	access: null,
	
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
	read: function()
	{
		this._user   = node.mread("user")
		this._group  = node.mread("group")
		this._access = node.mread("access") // rwxrwxrwx
		
		if(!this._access)
		{
			this._access = "rwxrwxrwx";
		}

		var a = this._access;
		
		this._userCanRead     = true; //a.charAt(0) == 'r';
		this._userCanWrite    = true; //a.charAt(1) == 'w';
		this._userCanExecute  = a.charAt(2) == 'x';
		
		this._groupCanRead    = a.charAt(0) == 'r';
		this._groupCanWrite   = a.charAt(1) == 'w';
		this._groupCanExecute = a.charAt(2) == 'x';
		
		this._otherCanRead    = a.charAt(0) == 'r';
		this._otherCanWrite   = a.charAt(1) == 'w';
		this._otherCanExecute = a.charAt(2) == 'x';
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
		
		this._access = s;
	},
	
	write: function()
	{
		node.mwrite("user", this._user)
		node.mwrite("group", this._group)
		this.updateAccess();
		node.mwrite("access", this._access)
	},
	
	isReadableByUser: function(user)
	{
		if (this._otherCanRead) { return true; }
		if (this._user == null) { return true; }
		if (this._user == user.username()) { return true; }
		if (user.groupNames().detect(this._group) && this._groupCanRead) { return true; }
		return false;
	},
	
	isWritableByUser: function(user)
	{
		if (this._otherCanWrite) { return true; }
		if (this._user == null) { return true; }
		if (this._user == user.username()) { return true; }
		if (user.groupNames().detect(this._group) && this._groupCanWrite) { return true; }
		return false;
	}
})

