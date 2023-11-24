const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const helmet = require('helmet')
const multer = require('multer')
const morgan = require('morgan')
const connectDB = require('./config/db')

// Initialize
dotenv.config()
connectDB` `
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan('dev'))
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cors({
    credentials: true,
}));

const upload = multer({ dest: "public/assets/images/" });

app.post("/api/upload-picture-evidence", upload.single("file"), (req, res) => {
    const imageName = req.file.filename;

    res.status(200).json({
        imageName
    });
});

// Routes
const postsRoutes = require('./routes/posts')
const usersRoutes = require('./routes/users')

app.use('/api/posts', postsRoutes)
app.use('/api/users', usersRoutes)

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server listening in ${process.env.NODE_ENV} mode on port: ${PORT}`));