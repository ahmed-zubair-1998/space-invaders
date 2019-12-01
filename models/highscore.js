const mongoose = require('mongoose');


const highscoreSchema = mongoose.Schema({
    _id: String,
	hs: [{
        user: String,
        score: String
    }]
}); 

module.exports = mongoose.model('Highscores', highscoreSchema);
 