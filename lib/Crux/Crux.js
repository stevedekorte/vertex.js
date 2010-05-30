var fs = require("fs");

//index.txt is used to order files for collation to be sent to the Browser
fs.readFileSync(__dirname + "/index.txt", "ascii").split("\n").forEach(function(name){
	require("./" + name);
});