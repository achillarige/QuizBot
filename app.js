var login = require("facebook-chat-api");
var http = require('https');
var fs = require('fs');
var secret = JSON.parse(fs.readFileSync(__dirname + "/secret.json"));

var userDB = {};


login({ email: secret.email,password: secret.password }, function callback(err, api) {
    if (err) return console.error(err);

    api.listen(function callback(err, message) {

    	   if(!(message.threadID in userDB)) {
            	userDB[message.threadID] = {
            		setData: []
            	}
            }

        //help message
        if (message.body.trim() === "help") {
            api.sendMessage("Available commands:\n\tmemorize <topic> - simulates quizlet learn mode using the most popular quizlet set on the topic"
            	, message.threadID);
            return;
        }

        //adding new user to DB
        
        //learn mode simulation
        if (message.body.startsWith("memorize")) { //new user or new learn mode game
            
         

            api.sendMessage("Hi "+message.senderName+"! Let's " + message.body + "...", message.threadID);
         
            quizletCall(message.body.substring(8).trim(), function(results) {
             
              	userDB[message.threadID].setData.push(results);
              	var data = userDB[message.threadID].setData
              	//simulates quizlet learn mode
              	function play() {
              		//selecting random term and definition
              		var rand = Math.floor(Math.random() * data[0].terms.length); 
              		var randT = data[0].terms[rand].term; 
              		var randD= data[0].terms[rand].definition; 
              		api.sendMessage(randT,message.threadID);
              		//listening for reply from user
              		var learnListener = api.listen(function callback(err,rmessage){
              			if(message.threadID === rmessage.threadID) {
              				if (err) return console.error(err)
              					if(rmessage.body.trim() === randD) {
              						data[0].terms.splice(rand,1); //removing term and definition from data set
              						api.sendMessage("Correct!",rmessage.threadID, 
              							function messageSent(err,messageInfo){
              								if(data[0].terms.length != 0)
              									play();
              							});
              					} else if(rmessage.body.trim() === "quit" ){
              						return learnListener();
              					} else {
              						api.sendMessage("Wrong! the correct answer is "+randD,rmessage.threadID, 
              							function messageSent(err,messageInfo){
              								if(data[0].terms.length != 0)
              								play();
              						});              					
              					}
              			}
              		});
              	}				
				play();                           	             
            });
        }
    });
 
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
                    var dat = parsed.sets[0].id
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