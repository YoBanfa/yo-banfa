var Game = require('./gameModel.js'),
    User = require('../users/userModel.js'),
    Card = require('../card/card.model.js')

module.exports = {
  //Add Game to database.  Shuffle deck.
  //note: duplicate found in csv.  note: some traditional chars missing
  create: function (req, res) {
    var newDeck = []
    var allCards;
    //Get all cards
    Card.find(function (err, cards) {
      if (err){ return handleError(res, err); }
      allCards = cards;
      //Generate deck of length 10
      while (newDeck.length < 10 && allCards.length > 0){
        var rng = Math.floor(Math.random() * allCards.length);
        newDeck.push(allCards[rng])
        allCards.splice(rng, 1);
      }
      //Game creation parameters
      var newGame = {
        creator: req.body.creator,
        challenged: req.body.challenged,
        deck: newDeck
      }
      //Create game
      Game.create(newGame, function(err, game){
        if (err){ console.log(err); }
        var conditions = { facebookId: req.body.creator };
        var update = { $push: { currentGames: game._id } };
        //Add game to user's list of currentGames
        User.update(conditions, update, function(err, numupdated){
          if (err){ console.log(err);}
          User.findOne(conditions, function (err, user) {
            if(err) { console.log(err); }
          }).populate('currentGames').exec(function(err, user){
            if(err) { console.log(err); }
          })
        });

        var conditions = { facebookId: req.body.challenged };
        User.update(conditions, update, function(err, numupdated){
          if (err){ console.log(err);}
          User.findOne(conditions, function (err, user) {
            if(err) { console.log(err); }
          }).populate('currentGames').exec(function(err, user){
            if(err) { console.log(err); }
          })
        });
        //Deck should be returned to user after creation
        return res.json(201, game);
      });
    });

  },

  //Load a game after a user accepts a challenge
  load: function (req, res) {
    Game.findOne({_id: req.params.game}, function (err, game) {
      if (err){ console.log(err); }
      if (!game){ return res.send(404); }
      res.json(game);
    });
  },

  //Update when the user completes the game
  update: function (req, res){
    //Update user's score
    //Callback should get scores for both players
    var conditions = {_id: req.params.game};
    var scoreToUpdate = req.body.creator === true ? 'creatorScore' : 'challengedScore';
    var update = {};
    update[scoreToUpdate] = req.body.lastScore
    Game.update(conditions, update, function(err, numupdated){
      if (err){ console.log(err);}
      Game.findOne(conditions, function (err, game) {
        if(err) { console.log(err); }
        if (game.creatorScore > -1 && game.challengedScore > -1){
          Game.update(conditions, {complete: true}, function(err, numupdated){
            if (err){ console.log(err);}
            res.json(game);
          });
        } else {
          res.json(game);
        }
      });
    });
  },

  //Return scores.  May be superfluous.
  getScores: function (req, res){
    //if both scores are >= 0
    //  call destroy function in callback
    //  alternatively, keep games forever and mark as complete
/*    Game.findOne({id: req.params.game}, function (err, game) {
      if(err) { return handleError(res, err); }
      if(!user) { return res.send(404); }
      res.json(game);
    });*/
  },

  //Destroy when both users complete the game (should do a request at end of game for both scores)
  //not necessary if games are marked complete instead.
  destroy: function(req, res){
    //remove specific game document from database
  }
};
