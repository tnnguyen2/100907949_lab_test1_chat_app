const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    room: {
        type: String,
        required: true,
        enum: ['devops', 'cloud', 'covid19', 'sports', 'nodeJS'],
    },
    message: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Message', messageSchema);
