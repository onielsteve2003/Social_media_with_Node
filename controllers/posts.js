const User = require('../models/users')
const Post = require('../models/posts')

// Add a post
exports.addPost = async(req, res) => {
    const newPost = new Post(req.body)
    try {
        const savedPost = await newPost.save()
        res.status(200).json(savedPost)
    } catch (err) {
        res.status(500).json(err)
    }
}

// Update a post
exports.updatePost = async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if(post.userId === req.body.userId) {
            await post.updateOne({ $set: req.body })
            res.status(200).json('Post updated')
        } else {
            res.status(403).json('You can only update your post')
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

// Get a post using post ID
exports.getAPost = async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        res.status(200).json(post)
    } catch (error) {
        console.log(error)
        res.status(500).json({
            code: 500,
            message: 'Something went wrong',
            error
        })
    }
}

// Get timeline posts
exports.getTimelinePosts = async(req, res) => {
    try {
        const currentUser = await User.findById(req.params.userId)
        const userPosts = await Post.find({ userId: currentUser._id })
        const friendPosts = await Promise.map.all(
            currentUser.followings.map((friendId) => {
                return Post.find({ userId: friendId })
            })
        )
        res.status(200).json(userPosts.concat(...friendPosts))
    } catch (error) {
        console.log(error)
        res.status(500).json({
            code: 500,
            message: 'Something went wrong',
            error
        })
    }
}

// Get all posts belonging to a user
exports.getUserPosts = async(req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
        const posts = await Post.find({ userId: user._id })
        res.status(200).json(posts)
    } catch (error) {
        req.status(500).json({
            code: 500,
            message: 'Something went wrong',
            error
        })
    }
}

// Get all app posts
exports.getPosts = async(req, res) => {
    const post = Post.find({})

    try {
        if(post){
            res.status(201).json({
                code: 201,
                message: 'Successful',
                data: post
            })
        } else {
            res.status(401).json({
                code: 401,
                message: 'No post found'
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
}

// Like and unlike a post
exports.likeAndUnlikePost = async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if(!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: {likes: req.body.userId} })
            res.status(200).json('This post has been liked')
        } else {
            await post.updateOne({ $pul: {likes: req.body.userId} })
            res.status(200).json('This post has been disliked')
        }
    } catch (error) {
        console.log(error)
        res.status(501).json({
            code: 501,
            message: 'Something went wrong',
            error
        })
    }
}

// Delete a post
exports.deletePost = async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if(post.userId === req.body.userId) {
            await post.deleteOne()
            res.status(200).json('This post has been deleted')
        } else {
            res.status(403).json('You can only delete your post')
        }
    } catch (error) {
        console.log(error)
        res.status(501).json({
            code: 501,
            message: 'Something went wrong', 
            error
        })
    }
}