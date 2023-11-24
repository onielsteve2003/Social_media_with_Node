const router = require('express').Router()
const upload = require('./utils/multer')
const { 
    signIn, 
    signUp, 
    validateOTP, 
    resendOTP, 
    forgotPassword, 
    logout, 
    changePassword, 
    updateUser, 
    savePost,
    unsavePost,
    addPostToStory,
    deletePostFromStory,
    deleteUser 
} = require('../controllers/users')
const { isAuthenticated } = require('../middleware/operations')

// Details
router.post('/signup',  upload.single('profilePicture'), signUp)
router.post('/login', signIn)
router.get('/validate-otp', validateOTP)
router.post('/forgot-password', forgotPassword)
router.post('/forgot-password/resend-otp', resendOTP)
router.post('/change-password', isAuthenticated, changePassword)
router.put('/update', isAuthenticated, updateUser)
router.post('/save-post/:postId', savePost);
router.delete('/unsave-post/:postId/:userId', unsavePost);
router.post('/add-to-story/:postId/:userId', addPostToStory);
router.delete('/delete-from-story/:postId/:userId', deletePostFromStory);
router.post('/logout', isAuthenticated, logout)
router.delete('/delete', isAuthenticated, deleteUser)

module.exports = router