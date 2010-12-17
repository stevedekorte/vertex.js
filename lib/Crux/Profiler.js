Profiler = Proto.clone().newSlots({
	protoType: "Profiler"
}).setSlots({
	init: function()
	{
		this.reset();
		return this;
	},
	
	reset: function()
	{
		this._observations = {};
	},
	
	profile: function(label, thisObj, fn)
	{
		var start = new Date();
		var result = fn.call(thisObj);
		var end = new Date();
		
		var dataSet = this._observations[label];
		if (!dataSet)
		{
			dataSet = { count: 0, total: 0 }
			this._observations[label] = dataSet;
		}
		dataSet.count ++;
		dataSet.total += (end.getTime() - start.getTime());
		return result;
	},
	
	logReport: function()
	{
		var results = [];
		Object_eachSlot_(this._observations, function(label, dataSet){
			results.push({
				label: label,
				count: dataSet.count,
				total: dataSet.total,
				avg: dataSet.total / dataSet.count
			});
		});
		
		function sortFn(x, y)
		{
			if(x.total < y.total)
			{
				return -1;
			}
			else
			{
				return 1;
			}
		}
		
		console.log("Profile:");
		console.log("label".alignLeft(30) + "count".alignLeft(10) + "total".alignLeft(10) + "avg".alignLeft(10));
		results.sort(sortFn).forEach(function(result){
			console.log(result.label.alignLeft(30) + result.count.toString().alignLeft(10) + result.total.toString().alignLeft(10) + result.avg.toString().alignLeft(10));
		});
		
		return this;
	}
}).init();

Proto.profileMethods = function()
{
	var methodNames = this.argsAsArray(arguments);
	
	var self = this;
	methodNames.forEach(function(methodName){
		self[methodName + "WithoutProfiling"] = self[methodName];
		self[methodName] = function()
		{
			var args = arguments;
			return Profiler.profile(methodName, this, function(){
				return this[methodName + "WithoutProfiling"].apply(this, args);
			});
		}
	});
	return this;
}