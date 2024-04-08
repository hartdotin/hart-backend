// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Counter = require('../model/counter'); 
const axios = require('axios');
require('dotenv').config();



router.post('/', async (req, res) => {
    //const { firebaseUid, name, dob, phone, lat, long, accessToken, gender, height, creationTime, lastSignInTime } = req.body;
    
    const { firebaseUid, preferences, location, ...userData } = req.body;

    // Transform the incoming location data into a GeoJSON format
    const geoLocation = {
        type: 'Point',
        coordinates: [location.long, location.lat], // Note: GeoJSON uses [longitude, latitude] order
    };

    if (!firebaseUid || !userData.phone) {
        return res.status(400).send({ message: 'firebaseUid and phone are required fields' });
    }

    try {
        let user = await User.findOne({ firebaseUid });
        if (user) {
            Object.keys(userData).forEach(key => {
                user[key] = userData[key];
            });
    
            if (userData.phone && userData.phone !== user.phone) {
            // Additional handling if phone number changes
            }

            const latChanged = location.lat !== user.location.coordinates[1];
            const longChanged = location.long !== user.location.coordinates[0];

            if (latChanged || longChanged) {
                console.log("Latitude or longitude has changed, updating location.");
                user.location = geoLocation;
                user.altitude = location.altitude;
                user.accuracy = location.accuracy;

                // Mapbox API call for reverse geocoding
                const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.long},${location.lat}.json?access_token=${process.env.MAPBOX_API}`;
                try {
                    const response = await axios.get(mapboxUrl);
                    console.log(response)
                    if (response.data.features.length > 0) {
                        const address = response.data.features[0].place_name;
                        user.address = address; // Assuming you have an 'address' field in your User model
                    }
                } catch (error) {
                    console.error('Failed to fetch address from Mapbox:', error);
                }

            } else {
                console.log("Latitude and longitude have not changed, skipping location update.");
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
                location: geoLocation,
                altitude: location.altitude,
                accuracy: location.accuracy,
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


router.post('/location', async (req, res) => {
    const { firebaseUid, location } = req.body;
    console.log(firebaseUid, location)

    if (!firebaseUid || !location || !location.lat || !location.long) {
        return res.status(400).send({ message: 'firebaseUid and valid location (lat, long) are required' });
    }

    // Mapbox API for reverse geocoding
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.long},${location.lat}.json?access_token=${process.env.MAPBOX_API}`;

    try {
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Check if latitude and longitude have significantly changed before updating
        const latChanged = !user.location.coordinates || location.lat !== user.location.coordinates[1];
        const longChanged = !user.location.coordinates || location.long !== user.location.coordinates[0];

        console.log(latChanged, longChanged)
        if (latChanged || longChanged) {
            // Fetching new address from Mapbox
            try {
                const response = await axios.get(mapboxUrl);
                if (response.data && response.data.features && response.data.features.length > 0) {
                    //console.log(response.data.features)

                    // Extracting the address
                    const address = response.data.features[0].place_name;
                    const locality = response.data.features.find(obj => obj.place_type == "locality" || obj.place_type == "neighborhood")?.text;
                    const place = response.data.features.find(obj => obj.place_type == "place" )?.text;
                    // Updating user's location and address
                    user.location = {
                        type: 'Point',
                        coordinates: [location.long, location.lat],
                        address: address,  // Assuming your location schema includes an 'address' field
                        locality: locality,
                        place: place
                    };
                } else {
                    console.log('No address found for the given coordinates.');
                    // Update location without address if not found
                    user.location = {
                        type: 'Point',
                        coordinates: [location.long, location.lat]
                    };
                }
            } catch (error) {
                console.error('Failed to fetch address from Mapbox:', error);
                // Consider how to handle partial failure gracefully
            }

            await user.save();
            return res.status(200).send({ message: 'Location and address updated successfully' });
        } else {
            return res.status(200).send({ message: 'Location unchanged' });
        }
    } catch (error) {
        console.error('Error updating user location:', error);
        res.status(500).send({ message: 'Error updating user location' });
    }
});



module.exports = router;
