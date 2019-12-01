const mongoose = require('mongoose');


const highscoreSchema = mongoose.Schema({
    _id: String,
	hs: [Array]
}); 

module.exports = mongoose.model('Highscores', highscoreSchema);
 