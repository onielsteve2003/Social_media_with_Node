const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    img: {
        type: String
    },
    likes: {
        type: Array,
        default: []
    },
    comment: {
        type: String,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Post', postSchema)