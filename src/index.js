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
    var urlStr = 'https://alexa-skill-restaurant.herokuapp.com/items/' + cafeteria.toLowerCase() + '/' + mealType.toLowerCase();
    //'/' + dietType.toLowerCase() ;
    console.log("Helloworld ucsdDining request to alexa-skill-restaurant: " + urlStr); 
    return urlStr;
};

var getJsonFromCalvin = function(cafeteria,mealType,callback){
    
    http.get(url(cafeteria,mealType), function(res){
    var body = '';
    console.log("Helloworld ucsdDining waiting data from alexa-skill-restaurant"); 
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
    "cafeteriaMenu": function (intent, session, response) {  
        
        var speechText = "";
        
        //Reprompt text in case the user does not respond   
        var repromptText = "You can ask, what is there to eat today";
        
        //get input slots        
        var cafeteria = intent.slots.cafeteria.value;
        var mealType = intent.slots.mealType.value;     
        
        // save new information to attributes
        if(cafeteria!==undefined ) {
          session.attributes.cafeteria = String(cafeteria);
        }
        if(mealType!==undefined ) {
          session.attributes.mealType = String(mealType);
        }
        var attCafeteria = session.attributes.cafeteria;
        var attMealType = session.attributes.mealType;

        //Produce response
        var asyncResponse = false;
        //Have all information
        if(attCafeteria!==undefined && attMealType!==undefined) {
            asyncResponse = true;
            //make api call
            getJsonFromCalvin(attCafeteria, attMealType, function(data){
            data = data[0];
            console.log('Helloworld ucsdDining response: ' + data);
            //command fails
            if(data.status=="failure")
            {
                speechText = String(data.err);
            }
            //command success
            else
            {
                data = data.resp;
                if(data.length===0)
                {
                    speechText = String(attCafeteria)+" is not serving anything today";
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
                    
                    speechText = String(attCafeteria)+" is serving "+ String(meals) +" for "+ String(attMealType) +" today";
                }
            }
            response.ask(speechText);
            });
        }
        else if(attCafeteria!==undefined && attMealType===undefined) {
          speechText = "Are you looking for breakfast, lunch or dinner options?";
          repromptText = "Say breafast, lunch or dinner";
        }
        else if(attCafeteria===undefined && attMealType!==undefined) {
          speechText = "Which cafeteria do you want to eat at?";
          repromptText = "Here's the list of available cafeterias. Todo: Query list";
        }

        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        
        if(!asyncResponse) {
            response.ask(speechOutput, repromptOutput);
        }
    },

    "dietaryRequirement": function (intent, session, response) { 
      var diet = intent.slots.diet.value;
      var restrictedFood = intent.slots.restrictedFood.value;
      var vegetarianChoice;
      var veganChoice;
      var glutenChoice;
      if(diet!==undefined) {
        switch(diet.toLowerCase()) {
            case "vegetarian":
                vegetarianChoice = true;
                break;
            case "vegan":
                veganChoice = true;
                break;
            case "gluten friendly":
                glutenChoice = true;
                break;
            case "gluten":
                glutenChoice = true;
                break;
            case "gluten-free":
                glutenChoice = true;
                break;
        }
      }

      if(restrictedFood!==undefined) {
        switch(restrictedFood.toLowerCase()) {
          case "meat":
            vegetarianChoice = true;
            break;
          case "gluten":
            glutenChoice = true;
            break;
        }
      }

      if(vegetarianChoice) {
        session.attributes.vegetarian = true;
      }
      if(veganChoice) {
        session.attributes.vegan = true;
      }
      if(glutenChoice) {
        session.attributes.gluten = true;
      }

      var speechText = "I will only show ";
      var options = []
      if(session.attributes.vegetarian === true) {
        options.push("vegetarian");
      }
      if(session.attributes.vegan === true) {
        options.push("vegan");
      }
      if(session.attributes.gluten === true) {
        options.push("gluten-friendly");
      }     

      response.ask(speechText + options.join(", ") + " options.");
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "HelpIntent was triggered";

        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        // For the repromptText, play the speechOutput again
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
    
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HelloWorld skill.
    var helloWorld = new HelloWorld();
    helloWorld.execute(event, context);
};
