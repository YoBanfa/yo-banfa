var gameController = require('./gameController.js');


module.exports = function (app) {
  // app === gameRouter injected from middlware.js

  app.post('/creategame', gameController.create);
  app.get('/:game/getgame', gameController.load)
  //app.get('/:game/getscores', gameController.getScores)
  app.post('/:game/updatescore', gameController.update);
  //app.delete('/:game/removegame', gameController.destroy);
};