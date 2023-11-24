const { checkPasswordStrength, sendMailOTP } = require("../middleware/operations")
const User = require("../models/users")
const Post = require("../models/posts")
const jwt = require('jsonwebtoken')
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)
const cloudinary = require('../routes/utils/cloudinary')
const bcrypt = require('bcryptjs')

// SignUp
exports.signUp = async(req, res) => {
    const { username, fullName, email, mobileNumber, password, confirmPassword } = req.body
    if(!username || !fullName || !email || !mobileNumber || !password || !confirmPassword || !req.file?.path){
        res.status(401).json({
            code: 401,
            message: 'failure',
            error: 'Enter all fields'
        })
    } else {
        const userExists = await User.findOne({ email })

        if(userExists){
            return res.status(401).json({
                code: 401,
                message: 'failure',
                error: 'User already exists'
            })
        }

        const checkPassword = checkPasswordStrength(password)

        if(!checkPassword.proceed){
            return res.status(403).json({
                code: 403,
                error: 'failure',
                message: checkPassword.message
            })
        }

        if(password !== confirmPassword){
            return res.status(401).json({
                code: 401,
                message: 'Failure',
                error: 'Passwords does not match'
            })
        }

        // Get uploaded image file from cloudinary
        const result = await cloudinary.uploader.upload(req.file.path) 

        // If all went well, create user
        User.create({
            username,
            fullName,
            email,
            mobileNumber,
            password,
            profilePicture: result?.secure_url
        })
        .then(user => {
            res.json({
                code: 200,
                message: 'Successful',
                data: {
                    userId: user._id
                }
            })
        })
        .catch(error => {
            console.log(error)
            res.status(500).json({
                code: 500,
                message: 'An error occured',
                error
            })
        })
    }
}

// Login
exports.signIn = async(req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    // Check if there is a user Login
    if(!user) return res.status(403).send({code: 403, message: 'Authentication failed, User not found'})

    user.comparePassword(password, (err, isMatch) => {
        if(isMatch && !err) {
            const token = jwt.sign({
                userId: user._id,
                email: user._id,
            }, process.env.SECRET_KEY)

            res.status(200).json({
                code: 200,
                message: 'Successful',
                data: {
                    token: token,
                    userId: user._id,
                }
            })
        } else {
            res.status(403).send({
                code: 403,
                message: 'Authentication failed, wrong password'
            })
        }
    })
}

// Validate OTP
exports.validateOTP = async(req, res) => {
    try {
        if(req.query.email && User(req.query.code).length === 6) {
            client
            .verify.v2
            .services(process.env.SERVICE_ID)
            .verificationChecks
            .create({to: req.query.email, code: req.query.email})
            .then(data => {
                // console.log(data)
                if(data.status === 'approved') {
                    User.findByIdAndUpdate({ email: req.query.email })
                    .then(user => {
                        res.status(200).json({
                            code: 200,
                            message: 'OTP Verification successful',
                            data: {
                                userId: user._id
                            }
                        })
                    })
                    .catch(error => {
                        console.log(error)
                        res.status(500).json({
                            code: 500,
                            message: 'something went wrong'
                        })
                    })
                } else {
                    res.status(401).json({
                        code: 401,
                        message: 'OTP not valid'
                    })
                }
            })
            .catch(err => {
                res.status(500).json({
                    code: 500,
                    error: err,
                    message: 'something went wrong'
                })
            })
        } else {
            res.status(400).send({
                code: 400,
                message: 'Invalid email or code',
                data: {
                    email: req.query.email
                }
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ 
            code: 500, 
            message: 'Something went wrong',
            error
        })
    }
}

// Follow a user
exports.followUser = async(req, res) => {
    if(req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id)
            const currentUser = await User.findById(req.body.userId)
            if(!user.followers.includes(req.body.userId)) {
                await user.updateOne({ $push: {followers: req.body.userId} })
                await currentUser.updateOne({ $push: {followings: req.params.id} })
                res.status(201).json({
                    code: 201,
                    message: 'User has been followed'
                })
            } else {
                res.status(403).json({
                    code: 403,
                    message: 'You already follow this user'
                })
            }
        } catch (error) {
            console.log(error)
            res.status(501).json({
                code: 501,
                message: 'Something went wrong',
                error
            })
        }
    } else {
        res.status(403).json({
            code: 403,
            message: "You can't follow yourself"
        })
    }
}

// Unfollow a user
exports.unfollowUser = async(req, res) => {
    if(req.body.userId !== req.params.id) {
        try {
            const user = await User.findById(req.params.id)
            const currentUser = await User.findById(req.body.userId)
            if(user.followers.includes(req.body.userId)) {
                await user.updateOne({ $pull: {followers: req.body.userId} })
                await currentUser.updateOne({ $pull: {followings: req.params.id} })
                res.status(201).json({
                    code: 201,
                    message: 'User has been unfollowed'
                })
            } else {
                res.status(403).json({
                    code: 403,
                    message: 'You do not follow this user'
                })
            }
        } catch (error) {
            console.log(error)
            res.status(501).json({
                code: 501,
                message: 'Something went wrong',
                error
            })
        }
    } else {
        res.status(403).json({
          code: 403,
          message: 'You cannot unfollow yourself'
        })
    }
}

// Resend OTP
exports.resendOTP = async(req, res) => {
    try {
        const { email } = req.body

        const OTP = await sendMailOTP(email)

        res.json({
            code: 200,
            message: 'OTP resent successfully',
            data: OTP
        })
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'An error occured',
            error
        })
    }
}

// Forgot password
exports.forgotPassword = async(req, res) => {
    const {userId, newPassword, confirmNewPassword} = req.body
    if(!userId || !newPassword || !confirmNewPassword){
        res.json({
            code: 403,
            message: 'Enter all fields'
        })
    }

    if(newPassword !== confirmNewPassword){
        res.json({
            code: 403,
            message: 'Passwords does not match'
        })
    }

    const check = checkPasswordStrength(newPassword)
    if(!check.proceed){
        return res.json({
            code: 403,
            message: check.message
        })
    }
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newPassword, salt, (err, hash) => {
            User.findByIdAndUpdate(userId, {$set: {password: hash}}).exec()
            .then(data => res.json({code: 200, message: 'Successful, You can now login with your new password', data}))
            .catch(error => res.json({code: 500, message: 'An error occured', error}))
        })
    })
}

// Change Password
exports.changePassword = async(req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body

    const user = await User.findById(req.user.userId).exec()
    user.comparePassword(currentPassword, (err, isMatch) => {
        if(isMatch && !err) {
            if(newPassword!== confirmNewPassword) {
                return res.status(403).json({
                    code: 403, 
                    message: 'Password does not match'
                })
            }
            if(currentPassword == newPassword) {
                return res.json({
                    code: 403, 
                    message: 'You cannot use your old password'
                })
            }
            const check = checkPasswordStrength(newPassword)
            if(!check.proceed){
                return res.status(403).json({
                    code: 403, 
                    message: check.message
                })
            }
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newPassword, salt, (err, hash) => {
                    User.findByIdAndUpdate(req.user.userId, { $set: {password: hash} }).exec()
                    .then(data => res.json({
                        code: 200,
                        message: 'You have successfully changed your password'
                    }))
                    .catch(error => res.status(500).json({
                        code: 500,
                        message: 'An error occured',
                        error
                    }))
                })
            })
        } else {
            res.status(403).send({
                code: 403, 
                message: 'Authentication failed, wrong password'
            })
        }
    })
}

// Update user
exports.updateUser = async(req, res) => {
    const { fullName, email, mobileNumber, bio, address } = req.body
    const user = await User.findById(req.body.id)

    if(!user) {
        return res.status(404).json({
            code: 404,
            message: 'User not found'
        })
    }

    const result = await cloudinary.uploader.upload(req.file.path)

    User.updateOne({ _id: req.user.userId }, {
        $set: {
            fullName: fullName || user.fullName,
            email: email || user.email,
            mobileNumber: mobileNumber || user.mobileNumber,
            bio: bio || user.bio,
            address: address || user.address,
            profilePicture: result?.secure_url || user.profilePicture,
            coverPicture: result?.secure_url || user.coverPicture
        }
    })
    .then(user => {
        res.status(201).json({
            code: 201,
            message: 'Successful',
            data: user
        })
    })
    .catch(err => {
        res.status(500).json({
            code: 500,
            message: 'Something went wrong',
            error: err
        })
    })
}

// save a post
exports.savePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        // Check if the post is already saved by the user
        if (!user.savedPosts.includes(postId)) {
            user.savedPosts.push(postId);
            await user.save();

            res.status(200).json({ message: 'Post saved successfully' });
        } else {
            res.status(400).json({ error: 'Post already saved by the user' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete a post from story
exports.deletePostFromStory = async (req, res) => {
    try {
        const { postId, userId } = req.params;

        // Find the user and the post
        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        // Remove the post from the user's storyPosts array
        user.storyPosts = user.storyPosts.filter(storyPost => storyPost.toString() !== postId);
        await user.save();

        res.status(200).json({ message: 'Post deleted from story successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Unsave a post
exports.unsavePost = async (req, res) => {
    try {
        const { postId, userId } = req.params;

        // Find the user and the post
        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        // Remove the post from the user's savedPosts array
        user.savedPosts = user.savedPosts.filter(savedPost => savedPost.toString() !== postId);
        await user.save();

        res.status(200).json({ message: 'Post unsaved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Add a post to story
exports.addPostToStory = async (req, res) => {
    try {
        const { postId, userId } = req.params;

        // Find the user and the post
        const user = await User.findById(userId);
        const post = await Post.findById(postId);

        // Add the post to the user's storyPosts array
        user.storyPosts.push(postId);
        await user.save();

        res.status(200).json({ message: 'Post added to story successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('accessToken', {
        secure: true,
        sameSite: 'none'
    }).status(200).json({
        code: 200,
        message: 'User Logged out'
    })
}

exports.deleteUser = async(req, res) => {
    try {   
    const user = await User.findById(req.user.userId).exec()
    if(!user) {
        res.status(401).json({
            code: 401,
            message: 'User not found'
        })
    } 
    
    await User.findByIdAndDelete(user._id).exec()
    res.status(200).json({
        code: 200,
        message: 'User profile deleted successfully'
    })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            code: 500,
            message: 'Something went wrong',
            error
        })
    }
}


