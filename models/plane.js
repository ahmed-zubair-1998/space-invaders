const mongoose = require('mongoose');


const usersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    arr: [{ name: String, info: String, pic: String }]

});

module.exports = mongoose.model('plane', usersSchema);
