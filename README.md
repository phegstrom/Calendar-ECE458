soCal - 1.0.0
===========


A calendar web app created for ECE 458 - Software Maintainability
 
#### Getting Started

* Install node using [Node Version Manager](https://github.com/creationix/nvm). We suggest using the cURL install script.
* Make sure you have MongoDB installed as well.  
* git clone this repo into your working directory  
* cd into the project directory
* You now must install the dependencies that are embedded within the project. Do so by typing

 `$ npm install`  

#### View production version
The app is being hosted at [https://socal.nodejitsu.com](https://socal.nodejitsu.com).  

####New Suggested features to test out in verson 1.0.0!
1. PUD with repeats  
    1.1 Create PUD and check repeat box   
    1.2 In the text box that appears, enter the amount of days for the repeat interval (NOTE: for grading, we made this actually do the interval in minutes behind the scenes, so an input of 4 means the PUD will repeat every 4 minutes once created)  
1.3 Complete the event within this time frame and wait for the interval to pass  
1.4 After, for example, 4 minutes, your To-Do section will be populated with the PUD!  

2. Event Request Invites  
    2.1  For easy testing, create two users in the system  
    2.2  Create an event  
    2.3 Click the invite button, invite the other user  
    2.4 Log in with the 'shared to' user  
    2.5 Check the 'Invite' list, you should see the invite!


#### Running the app locally
 1. Navigate to the project directory
 
 2. Spin up a mongoDB instance by typing

  `$ mongod --dbpath ./data/db`
 3. Open new terminal window and type

  `$ node ./bin/www`
 4. The server is now running and listening on localhost:3000! A verification statement that the DB had successfully connected should be console logged at this point in time. 
