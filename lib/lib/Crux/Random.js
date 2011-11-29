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
	},
	
	userAgent: function()
	{
		var total = Random.USER_AGENTS.last()[2];
		var pickTotal = Random.intBetween(1, total);
		
		return Random.USER_AGENTS.detect(function(agent){
			return agent[2] >= pickTotal;
		})[0];
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
	
	var total = 0;
	Random.USER_AGENTS = [["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3", 103730],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.70 Safari/533.4", 67075],
	["Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.70 Safari/533.4", 35785],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.19) Gecko/2010031422 Firefox/3.0.19", 30686],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1.9) Gecko/20100315 Firefox/3.5.9", 20079],
	["Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3", 19719],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (.NET CLR 3.5.30729)", 17451],
	["Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.70 Safari/533.4", 14576],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.2) Gecko/20100115 Firefox/3.6", 13,638],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/5.0.375.55 Safari/533.4", 13505],
	["Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Trident/4.0; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; InfoPath.2; .NET CLR 3.5.30729; .NET CLR 3.0.30729)", 11015],
	["Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (.NET CLR 3.5.30729)", 7832],
	["Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.0.19) Gecko/2010031422 AskTbUT2V5/3.8.0.12304 Firefox/3.0.19", 7778],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 ( .NET CLR 3.5.30729)", 7465],
	["Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; GTB6.5; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152)", 6626],
	["Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)", 5691],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1.5) Gecko/20091102 Firefox/3.5.5", 5611],
	["Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.1.9) Gecko/20100315 Firefox/3.5.9 (.NET CLR 3.5.30729)", 5000]].map(function(pair){
		total = total + pair[1];
		return pair.append(total);
	});
	
}).call();