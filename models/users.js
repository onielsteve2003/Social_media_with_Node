const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        lowercase: true,
        trim: true
    },
    coverPicture: {
        type: String,
        lowercase: true,
        trim: true
    },
    bio: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    followers: {
        type: Array,
        default: []
    },
    followings: {
        type: Array,
        default: []
    },
    relationship: {
        type: Number,
        enum: [1, 2, 3]
    },
    savedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
    ],
    storyPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
    ],
}, {
    timestamps: true
})

userSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err)
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err)
                }
                user.password = hash;
                next()
            })
        })
    }
    else {
        return next()
    }
})

userSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if(err) {
            return cb(err)
        }
        cb(null, isMatch)
    })
}

module.exports = {
    User: mongoose.model("User", userSchema)
}