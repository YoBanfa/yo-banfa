var userController = require('./userController.js');


module.exports = function (app) {
  // app === userRouter injected from middlware.js

  //app.post('/signup', userController.signup);
  app.post('/signin', userController.signin);
  app.get('/:userID/friendslist', userController.getFriends);
  app.get('/:userID/challenges', userController.getChallenges);
  app.get('/:userID/facebookId', userController.getFriends);
  app.get('/:userID', userController.getInfo)

};