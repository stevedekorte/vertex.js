Delegator = Proto.clone().newSlots({
	protoType: "Delegator",
	connections: null
}).setSlots({
	init: function()
	{
		this.setConnections([]);
	},
	
	addDelegate: function(delegate, action)
	{
		var existing = this.connections().detect(function(connection){ return connection.delegate == delegate });
		
		if(existing)
		{
			existing.action = action;
		}
		else
		{
			this.connections().append({ delegate: delegate, action: action });
		}

		return this;
	},
	
	removeDelegate: function(delegate)
	{
		var existing = this.connections().detect(function(connection){ return connection.delegate == delegate });
		this.connections().remove(existing);
		return this;
	},
	
	sendDelegates: function()
	{
		var args = Arguments_asArray(arguments);
		var eventName = args.removeFirst();
		args.prepend(this);
		
		this.connections().forEach(function(connection){
			var messageName;
			
			if(connection.action)
			{
				messageName = connection.action + eventName.asCapitalized();
			}
			else
			{
				messageName = eventName;
			}
			var fn = connection.delegate[messageName]
			if(fn)
			{
				fn.apply(connection.delegate, args);
			}
		});
		
		return this;
	},
	
	sendDelegatesDelayed: function()
	{
		var args = Arguments_asArray(arguments);
		var self = this;
		setTimeout(function(){
			self.sendDelegates.apply(self, args);
		}, 0);
		
		return this;
	}
});