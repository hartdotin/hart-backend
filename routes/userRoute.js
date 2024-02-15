// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Counter = require('../model/counter'); 

router.post('/', async (req, res) => {
    //const { firebaseUid, name, dob, phone, lat, long, accessToken, gender, height, creationTime, lastSignInTime } = req.body;
    console.log(req)
    const { firebaseUid,preferences, ...userData } = req.body;

    if (!firebaseUid || !userData.phone) {
        return res.status(400).send({ message: 'firebaseUid and phone are required fields' });
    }

    try {
        let user = await User.findOne({ firebaseUid });
        if (user) {
            console.log('user already present', userData)
            Object.keys(userData).forEach(key => {
                user[key] = userData[key];
            });
    
            if (userData.phone && userData.phone !== user.phone) {
            // Additional handling if phone number changes
            }
    
            await user.save();
            return res.status(200).send({ message: 'User updated successfully', user });

        } else{
            const counter = await Counter.findOneAndUpdate(
                { _id: 'userIdCounter' },
                { $inc: { count: 1 } },
                { new: true, upsert: true }
            );
    
            const newUser = new User({
                userId: counter.count,
                firebaseUid,
                preferences,
                ...userData
            });
    
            await newUser.save();
            res.status(201).send({ message: 'User created successfully', userId: newUser.incrementalId });

        }

        // user = await User.findOne({ phone });
        // if (user) {
        //     return res.status(409).send({ message: 'User with this phone number already exists' });
        // }
    } catch (error) {
        console.error('Error creating/updating user:', error);
        res.status(500).send('Error creating/updating user');
    }
});


// Route to get user information by firebaseUid
router.get('/:firebaseUid', async (req, res) => {
    const { firebaseUid } = req.params; // Extract firebaseUid from URL parameters
    console.log(req)
    console.log(firebaseUid)
    if (!firebaseUid) {
        return res.status(400).send({ message: 'firebaseUid is required' });
    }

    try {
        const user = await User.findOne({ firebaseUid: firebaseUid });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Optionally, filter the response to send only relevant information
        const { hasCompletedOnboarding, name, email, phone, ...otherDetails } = user.toObject();
        res.status(200).send({ hasCompletedOnboarding, name, email, phone, ...otherDetails });

    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).send({ message: 'Error fetching user information' });
    }
});

module.exports = router;
