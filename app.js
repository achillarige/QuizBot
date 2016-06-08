var login = require("facebook-chat-api");
var http = require('https');
var fs = require('fs');
var secret = JSON.parse(fs.readFileSync(__dirname + "/secret.json"));

var userDB = {};


login({
    email: secret.email,
    password: secret.password
}, function callback(err, api) {
    if (err) return console.error(err);

    api.listen(function callback(err, message) {

        //help message
        if (message.body.trim() === "help") {
            api.sendMessage("Available commands:\n\tmemorize <topic> - simulates quizlet learn mode using the most popular quizlet set on the topic"
            	, message.threadID);
            return;
        }

        //learn mode simulation
        if (message.body.startsWith("memorize")) {
            api.sendMessage("Lets " + message.body + "...", message.threadID);
            var info;
            quizletCall(message.body.substring(8).trim(), function(results) {
             
              	//simulates quizlet learn mode
              	function play() {
              		//selecting random term and definition
              		var rand = Math.floor(Math.random() * results.terms.length); 
              		var randT = results.terms[rand].term; 
              		var randD= results.terms[rand].definition; 
              		api.sendMessage(randT,message.threadID);
              		//listening for reply from user
              		var learnListener = api.listen(function callback(err,message){
              			if (err) return console.error(err)
              				if(message.body.trim() === randD) {
              					results.terms.splice(rand,1); //removing term and definition from data set
              					api.sendMessage("Correct!",message.threadID, 
              						function messageSent(err,messageInfo){
              							if(results.terms.length != 0)
              								play();
              						});
              				} else if(message.body.trim() === "quit" ){
              					return learnListener();
              				} else {
              					api.sendMessage("Wrong! the correct answer is "+randD,message.threadID, 
              						function messageSent(err,messageInfo){
              							if(results.terms.length != 0)
              							play();
              					});              					
              				}
              		});
              	}				
				play();                           	             
            });
        }
    });



    var dat;
    //getting information about a quizlet set, given user input on a key word
    function quizletCall(input, callback) {
        //searching for sets given term or keywords
        var lmao = http.get("https://api.quizlet.com/2.0/search/sets?client_id=vBpqmBknHp&whitespace=1&q=" + input,
            function(response) {
                // Continuously update stream with data
                var body = '';
                response.on('data', function(d) {
                    body += d;
                });
                response.on('end', function() {
                    var parsed = JSON.parse(body)
                    dat = parsed.sets[0].id
                    http.get("https://api.quizlet.com/2.0/sets/" + dat + "?client_id=vBpqmBknHp&whitespace=1",

                        function(response) {
                            // Continuously update stream with data
                            var body = '';
                            response.on('data', function(d) {
                                body += d;
                            });
                            response.on('end', function() {
                                var finalInfo = JSON.parse(body);
                                callback(finalInfo);
                            });
                        });
                });
            });
    }
});