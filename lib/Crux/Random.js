Random = Proto.clone().newSlots({
	protoType: "Random"
}).setSlots({
	base64Url: function(length)
	{
		if(!length)
		{
			length = 6;
		}

		var randChars = [];
		var chars = this.BASE_64_CHARS;
		for(var i = 0; i < length; i ++)
		{
			randChars.push(chars[Math.floor(Math.random()*chars.length)]);
		}
		return randChars.join("");
	},
	
	intBetween: function(start, endInclusive)
	{
		return Math.floor(Math.random() * (endInclusive - start + 1)) + start;
	}
});

(function(){
	var chars = [];
	for(var i = "0".charCodeAt(); i <= ("9".charCodeAt()); i ++)
	{
		chars.push(String.fromCharCode(i));
	}
	for(var i = "a".charCodeAt(); i <= ("z".charCodeAt()); i ++)
	{
		chars.push(String.fromCharCode(i));
	}
	for(var i = "A".charCodeAt(); i <= ("Z".charCodeAt()); i ++)
	{
		chars.push(String.fromCharCode(i));
	}
	chars.push("-");
	chars.push("_");
	
	Random.BASE_64_CHARS = chars;
}).call();