const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    userId: Number,
    creationTime: { type: Date, default: Date.now },
    lastSignInTime: { type: Date, default: Date.now },
    name: String,
    dateOfBirth: Number,
    phone: { type: String, required: true, unique: true },
    gender: String,
    height: String,
    interests: [String],
    location: {
        lat: Number,
        long: Number
    },
    bio: String,
    profilePictures: [Object],
    lookingFor: [String], 
    preferences: {
        ageRange: {
            min: Number,
            max: Number
        },
        distance: Number
    }
});

module.exports =  mongoose.model('User', userSchema);


