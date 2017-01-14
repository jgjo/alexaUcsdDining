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

/**
 * App ID for the skill
 */

var http = require('http');

var url = function(cafeteria, mealType){
    return 'https://l.facebook.com/l.php?u=https%3A%2F%2Falexa-restaurant-calvinxgomez.c9users.io%2Fitems%2F&h=BAQGkxje4&s=1/' + cafeteria + '/' + mealType;
};

var getJsonFromCalvin = function(cafeteria,mealType,callback){
    
    http.get(url(cafeteria,mealType), function(res){
    var body = '';

    res.on('data', function(data){
      body += data;
    });

    res.on('end', function(){
      var result = body;
          //JSON.parse(body);
      callback(result);
    });

  }).on('error', function(e){
    console.log('Error: ' + e);
  });
    
};

var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * ucsdDining is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var ucsdDining = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
ucsdDining.prototype = Object.create(AlexaSkill.prototype);
ucsdDining.prototype.constructor = ucsdDining;

ucsdDining.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("ucsdDining onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

ucsdDining.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("ucsdDining onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa Skills Kit, you can say hello";
    var repromptText = "You can say hello";
    response.ask(speechOutput, repromptText);
};

ucsdDining.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("ucsdDining onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

ucsdDining.prototype.intentHandlers = {
    // register custom intent handlers
    "cafeteriaMenu": function (intent, session, response) {
        var cafeteria = intent.slots.cafeteria.value;
        var mealType = intent.slots.mealType.value;
        
        getJsonFromMta(intent.slots.bus.value, function(data){
        if(data.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit){
            var text = data
                  .Siri
                  .ServiceDelivery
                  .StopMonitoringDelivery[0]
                  .MonitoredStopVisit[0]
                  .MonitoredVehicleJourney
                  .MonitoredCall
                  .Extensions
                  .Distances
                  .PresentableDistance;
      var cardText = 'The next bus is: ' + text;
    } else {
      var text = 'That bus stop does not exist.'
      var cardText = text;
    }

    var heading = 'Next bus for stop: ' + intent.slots.bus.value;
    response.tell(String(cafeteria)+" is serving fries for "+ String(mealType) +"today");
  });
        
        
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the ucsdDining skill.
    var ucsdDining = new ucsdDining();
    ucsdDining.execute(event, context);
};