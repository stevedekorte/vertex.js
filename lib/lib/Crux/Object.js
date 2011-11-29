Object_clone = function(plist)
{
	Proto.cloneConstructor.prototype = plist;
	return new Proto.cloneConstructor;
}

Object_sorted = function(object)
{
	var sortedObject = {};
	Object_slotNames(object).sort().forEach(function(k) 
	{
		//console.log("k:" + k + " v:" + object[k]);
		var v = object[k];
		
		if(typeof(v) == "Object") 
		{ 
			v = Object_sorted(v); 
		}
		
		sortedObject[k] = v;
	});
	return sortedObject;
}

Object_slotNames = function(source)
{
	var names = [];
	
	for(var name in source)
	{
		names.push(name);
	}
	
	return names;
}

Object_slotValues = function(source)
{
	var values = [];
	
	for(var name in source)
	{
		values.push(source[name]);
	}
	
	return values;
}

Object_popFirstKey = function(source)
{
	// warning! This is SLOW.
	for(var name in source)
	{
		delete source[name];
		return name;
	}
	
	return null;
}

Object_slotCount = function(source)
{
	var count = 0
	for(var name in source)
	{
		count = count + 1
	}
	
	return count;
}

Object_emptyObject = function()
{
	var a = {}
	/*
	a["println"] = null
	a["printlnWithPrefix"] = null
	
	//delete a.prototype
	
	writeln("a.println = ", a.println)
	writeln("a.printlnWithPrefix = ", a.printlnWithPrefix)
	
	//delete a["println"]
	//delete a["printlnWithPrefix"]

	writeln("a.println = ", a.println)
	writeln("a.printlnWithPrefix = ", a.printlnWithPrefix)
	
	
	writeln("printing a")
	for (var k in a)
	{
		writeln("slot: ", k, ": '", a[k], "'")
	}
	return
		*/
	return a
}

Object_removeAllSlots = function(source)
{	
	/*
	while (Object_popFirstKey(source))
	{
	}
	*/
	
	return source;
}

Object_shallowCopyTo_ = function(source, dest)
{
	for(var name in source)
	{
		if(source.hasOwnProperty(name))
		{
			dest[name] = source[name];
		}
		
	}
	
	return dest;
}

Object_shallowCopyFrom_ = function(dest, source)
{
	return Object_shallowCopyTo_(source, dest);
}

Object_carefullyShallowCopyTo_ = function(source, dest)
{
	for(var name in source)
	{
		if(source.hasOwnProperty(name))
		{
			if(dest[name])
			{
				throw new Error(name + " already exists on destination");
			}
			dest[name] = source[name];
		}
	}
	
	return dest;
}

Object_carefullyShallowCopyFrom_ = function(dest, source)
{
	return Object_carefullyShallowCopyTo_(source, dest);
}

Object_atPath_ = function(obj, path)
{
	v = { "": obj };
	
	path.pathComponents().forEach(function(pc)
	{
		if(v)
		{
			v = v[pc];
		}
	});
	
	return v;
}

Object_slotPairs = function(obj)
{
	var pairs = [];
	
	for(var name in obj)
	{
		if(obj.hasOwnProperty(name))
		{
			pairs.push([name, obj[name]]);
		}
	}
	
	return pairs;
}

Object_eachSlot_ = function(obj, fn)
{
	var self = this;
	return Object_slotPairs(obj).forEach(function(pair){
		return fn.call(self, pair[0], pair[1]);
	});
}

Object_mapSlots_ = function(obj, fn)
{
	var self = this;
	return Object_slotPairs(obj).map(function(pair){
		return fn.call(self, pair[0], pair[1]);
	});
}

Object_isEmpty = function(obj)
{
	for(var k in obj)
	{
		return false;
	}
	
	return true;
}

Object_mergeInPlace = function(obj, anotherObj)
{
	Object_eachSlot_(anotherObj, function(k, v){
		obj[k] = v;
	});
	
	return obj;
}

/*
function AssertException(message) 
{
	this.message = message; 
}

AssertException.prototype.toString = function() 
{
	return 'AssertException: ' + this.message;
}
*/

assert = function(exp, message) 
{
	if (!exp) 
	{
		/*
		try
		{
			*/
			throw new Error("assert failed");
		/*}
		catch(e)
		{
			inspect(e)
			writeln(e.stack())
		}
		*/
		//throw new AssertException(message);
	}
}