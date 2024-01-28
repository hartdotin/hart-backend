const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
// Import routes
const userRoutes = require('./routes/userRoute');
const uploadPictures = require('./routes/uploadPictures')
const errorHandler = require('./middleware/errorMiddleware');
const promptRoute = require('./routes/promptRoute')


const app = express();


// Middleware
app.use(cors());
app.use(bodyParser.json({extended: true}))
app.use(bodyParser.urlencoded({extended: true}))
//app.use(bodyParser.json());



// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));


// const authenticateUser = async (req, res, next) => {
//   console.log(req.headers)
//   const token = req.headers.authorization?.split('Bearer ')[1];
//   console.log(token)

//   if (!token) {
//     return res.status(401).send('No token provided');
//   }

//   if (token === 'dev'){
//     next()
//   }

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token);
//     console.log(decodedToken)
//     req.user = decodedToken; // Add the user info to the request object
//     next();
//   } catch (error) {
//     res.status(403).send('Invalid token');
//   }
// };

app.use('/user', userRoutes);
app.use('/upload', uploadPictures);
app.use('/', promptRoute)

// Middleware
app.use(errorHandler);


// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

