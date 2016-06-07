var login = require("facebook-chat-api");
var http = require('https');

// Create simple echo bot
login({email: "email@site.domain", password: "password"}, function callback (err, api) {
    if(err) return console.error(err);

    api.listen(function callback(err, message) {
        
    	//help message
        if(message.body.trim() === "help"){
    		api.sendMessage("Available commands:\n\tmemorize <topic> - simulates quizlet learn mode using the most popular quizlet set on the topic"
    			+"\n\tdefine <word> - Defines a given word.", message.threadID);
    		return;
    	}

    	//learn mode simulation
    	if(message.body.startsWith("memorize")) {
    		api.sendMessage("Lets "+message.body+"...", message.threadID);
 			var info;
    		quizletCall(message.body.substring(8).trim(),function(error, results){
    			if(error){
    				console.log(error);
    				return;
    			}

    			info = JSON.parse(results.content)
    			console.log(info.terms[0].term);
    			console.log(info.terms[0].definition);

    		});
    	}
    });

    var dat;
   	//getting information about a quizlet set, given user input on a key word
    function quizletCall (input,callback) {
    	//searching for sets given term or keywords
    	var lmao= http.get("https://api.quizlet.com/2.0/search/sets?client_id=vBpqmBknHp&whitespace=1&q="+input, 
    		function(response){
    	        // Continuously update stream with data
    	        var body = '';
    	        response.on('data', function(d) {
    	            body += d;
    	        });
    	        response.on('end', function() {
    	            var parsed = JSON.parse(body)
    	            console.log(parsed.sets[0].id)
    	            dat = parsed.sets[0].id  
    	            console.log(dat)
    	            http.get("https://api.quizlet.com/2.0/sets/"+ dat +"?client_id=vBpqmBknHp&whitespace=1",

    	             function(response) {
    	                    // Continuously update stream with data
    	                    var body = '';
    	                    response.on('data', function(d) {
    	                        body += d;
    	                    });
    	                    response.on('end', function() {
    	                       console.log(body)
    	                       callback(body);          
    	                    });
    	                });         
    	        });
    	    });
    }



});