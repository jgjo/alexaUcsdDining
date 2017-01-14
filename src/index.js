/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Hello World to say hello"
 *  Alexa: "Hello World!"
 */
 
 /* CALLING THE API */
var http = require('https');

var url = function(cafeteria, mealType){
    return 'https://alexa-skill-restaurant.herokuapp.com/items/' + cafeteria.toLowerCase() + '/' + mealType.toLowerCase() ;
};

var getJsonFromCalvin = function(cafeteria,mealType,callback){
    
    http.get(url(cafeteria,mealType), function(res){
    var body = '';

    res.on('data', function(data){
      body += data;
      console.log("Helloworld ucsdDining receiving data from alexa-skill-restaurant: " + data); 
    });

    res.on('end', function(){
      var result = JSON.parse(body);
      console.log("Helloworld ucsdDining received data from alexa-skill-restaurant: " + body ); 
      callback(result);
    });

  }).on('error', function(e){
    console.log('Helloworld ucsdDining error in receiving data: ' + e);
  });
    
};

/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * HelloWorld is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var HelloWorld = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
HelloWorld.prototype = Object.create(AlexaSkill.prototype);
HelloWorld.prototype.constructor = HelloWorld;

HelloWorld.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HelloWorld onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

HelloWorld.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HelloWorld onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa Skills Kit, you can say hello";
    var repromptText = "You can say hello";
    response.ask(speechOutput, repromptText);
};

HelloWorld.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("HelloWorld onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

HelloWorld.prototype.intentHandlers = {
    // register custom intent handlers
    // register custom intent handlers
    "cafeteriaMenu": function (intent, session, response) {
        var cafeteria = intent.slots.cafeteria.value;
        var mealType = intent.slots.mealType.value;
        getJsonFromCalvin(cafeteria, mealType, function(data){
            data = data[0];
            if(data.status=="failure")
            {
                response.tell(String(data.err));
            }
            else
            {
                data = data.resp;
                if(data.length==0)
                {
                    response.tell(String(cafeteria)+" is not serving anything today");
                }
                else
                {
                    var meals = '';
                    for (var i = 0; i < data.length; i++) {
                        if(i == data.length - 1)
                            meals += data[i].name;
                        else if(i == data.length -2)
                            meals += data[i].name + " and ";
                        else
                            meals += data[i].name + ", ";
                    }
                    console.log('Helloworld ucsdDining test meals: ' + meals);
                    response.tell(String(cafeteria)+" is serving "+ String(meals) +" for "+ String(mealType) +" today");
                }
            }
        }); 
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HelloWorld skill.
    var helloWorld = new HelloWorld();
    helloWorld.execute(event, context);
};

