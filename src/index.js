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

//var cafeterias = ["64 degrees","canyon vista","foodworx","oceanview","pines","the bistro","club med","flavors of the word food truck","goody's","goody's to go truck","roots","sixty-four north","warren college","sixth college","the village east","village east","school of medicine"];
var cafeterias = ["64°","canyon vista","ocean view","food works","pines","the bistro","club med","flavors of the world","flavors of the world food truck","goodies","goodies to go truck","goodies to go ","roots","sixty four north","warren college","sixth college","the village east","school of medicine","revelle college ","marshall college","muir college ","food truck","food trucks"];

var getDietaryChoices = function(session) {
    var options = []
    if(session.attributes.vegetarian === true) {
      options.push("vegetarian");
    }
    if(session.attributes.vegan === true) {
      options.push("vegan");
    }
    if(session.attributes.gluten === true) {
      options.push("gluten friendly");
    }  
    return options;
}

 var checkMealAgainstDiet = function(meal, dietChoices) {
  meal_diet_type = undefined;
  if(meal.diet_type[0] !== undefined){
    meal_diet_type = String(meal.diet_type[0].type).toLowerCase();
  }
  console.log(meal.name + " is " + meal_diet_type + " and the user's diet choices are " + dietChoices.toString());
  var matchingDiet = (dietChoices.indexOf(meal_diet_type) > -1)
  if(matchingDiet) {
    return true;
  }
  else {
    return false;
  }
}

var askMensaChoice = function (mensaChoices, location, isFoodTruck, response){
  if(isFoodTruck){
    speechText = "There are multiple food trucks: ";
  }
  else {
    speechText = "There are multiple cafeterias near " + location + ": ";
  }

  choices_formatted = [mensaChoices.slice(0, -1).join(', '), mensaChoices.slice(-1)[0]].join(mensaChoices.length < 2 ? '' : ' and ');
  choicesText = choices_formatted + ". Which one do you mean?";
  response.ask(speechText + choicesText);
}

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

        //detect synonyms for cafeteria - given the college
        if(cafeteria!==undefined) {
          switch(cafeteria.toLowerCase().trim()) {
            case "warren college":
              cafeteria = "canyon vista";
              break;

            case "sixth college":
              cafeteria = "food works";
              break;

            case "the village east":
              cafeteria = "the bistro";
              break;

            case "village east":
              cafeteria = "the bistro";
              break;

            case "school of medicine":
              cafeteria = "club med";
              break;

            case "flavors of the world":
              cafeteria = "flavors of the world food truck";
              break;

            case "goodies to go":
              cafeteria = "goodies to go truck";
              break;
            }
        }

        var skipOutput = false;
        var mensaChoices = [];
        //handle colleges with multiple cafeterias --> Ask user to select one
        if(cafeteria!==undefined) {
          switch(cafeteria.toLowerCase().trim()) {
            case "revelle college":
              mensaChoices = ["64°","Sixty Four North"];
              isFoodTruck = false;
              askMensaChoice(mensaChoices,cafeteria,isFoodTruck,response);
              skipOutput = true;
              break;
            case "marshall college":
              mensaChoices = ["Ocean View","Goodies"];
              isFoodTruck = false;
              askMensaChoice(mensaChoices,cafeteria,isFoodTruck,response);
              skipOutput = true;
              break;
            case "muir college":
              mensaChoices = ["Pines","Roots"];
              isFoodTruck = false;
              askMensaChoice(mensaChoices,cafeteria,isFoodTruck,response);
              skipOutput = true;
              break;
            case "food truck":
              mensaChoices = ["Flavors of The World Food Truck","Goodies To Go Truck"];
              isFoodTruck = true;
              askMensaChoice(mensaChoices,cafeteria,isFoodTruck,response);
              skipOutput = true;
              break;
            case "food trucks":
              mensaChoices = ["Flavors of The World Food Truck","Goodies To Go Truck"];
              isFoodTruck = true;
              askMensaChoice(mensaChoices,cafeteria,isFoodTruck,response);
              skipOutput = true;
              break;
            }
        }

        if(!skipOutput){
          //verify cafeteria input 
          if(cafeteria !== undefined && cafeterias.indexOf(cafeteria.toLowerCase().trim()) <= -1) {
            // not a valid cafeteria
            cafeteria = undefined;
            // TODO find closest match and prompt user for it
          }
          
          // save new information to attributes
          if(cafeteria!==undefined ) {
            session.attributes.cafeteria = String(cafeteria).toLowerCase().trim();
          }
          if(mealType!==undefined ) {
            session.attributes.mealType = String(mealType).toLowerCase().trim();
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
                      meals = [];
                      var dietChoices =  getDietaryChoices(session);
                      diet_filter = false;
                      if(dietChoices.length >= 1) {
                        diet_filter = true;
                      }
                      for (var i = 0; i < data.length; i++) {
                          meal = data[i];
                          if(!diet_filter || checkMealAgainstDiet(meal, dietChoices)){
                            // Meal meets the dietary choices and is therefore listed
                            meals.push(meal.name);
                          }
                          else {
                            // Meal doesn't meet the dietary choices
                            continue;
                          }
                      }
                      //format meals nicely
                      var meals_formatted = [meals.slice(0, -1).join(', '), meals.slice(-1)[0]].join(meals.length < 2 ? '' : ' and ').replace("&","and");
                      speechText = String(attCafeteria)+" is serving the following meals for " + String(attMealType) + " today: " + String(meals_formatted);
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
          else if(attCafeteria===undefined && attMealType===undefined) {
            speechText = "I'm sorry. Please say again which cafeteria you want to eat at.";
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
      }
    },

    "dietaryRequirement": function (intent, session, response) { 
      var diet = intent.slots.diet.value;
      var restrictedFood = intent.slots.restrictedFood.value;
      var vegetarianChoice;
      var veganChoice;
      var glutenChoice;
      if(diet!==undefined) {
        switch(diet.toLowerCase().trim()) {
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
        switch(restrictedFood.toLowerCase().trim()) {
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
      var options = getDietaryChoices(session);

      response.ask(speechText + options.join(", ") + " options.");
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "To get a list of today's offered meals please say the name of your desired cafeteria and indicate if you're interested in breakfast, lunch or dinner options.";

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
