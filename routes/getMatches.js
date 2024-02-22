const express = require('express');
const User = require('../model/user');
const router = express.Router();



router.get('/:firebaseUid', async (req, res) => {
    const { firebaseUid } = req.params;
    //console.log(res)

    if (!firebaseUid) {
        return res.status(400).send({ message: 'firebaseUid is required' });
    }

    try {
        // Find the user and their preferences
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        //console.log(user.preferences)

        // Calculate the user's age from dateOfBirth
        
        const currentYear = new Date().getFullYear();
        const fromBirthYear = currentYear - user.preferences.ageRange.max;
        const toBirthYear = currentYear - user.preferences.ageRange.min;


        const targetNumberOfMatches = 25;
        let allMatches = [];
        //console.log(toBirthYear, fromBirthYear)

        // Convert the distance preference to meters
        const maxDistance = user.preferences.distance * 1000; // Assuming distance is in kilometers
        console.log(maxDistance)

        // Construct the query to find matches based on user preferences and interestedIn
        // Always exclude the current user from the results
        //const excludeCurrentUser = { _id: { $ne: user._id }, gender: user.interestedIn };

        // Define preferred criteria with AND logic including the exclusion
        const preferredQuery = {
            _id: { $ne: user._id }, 
            gender: user.interestedIn,
            dateOfBirth: {
                $gte: fromBirthYear,
                $lte: toBirthYear
            },
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: user.location.coordinates },
                    $maxDistance: maxDistance
                }
            }
        };

        let preferredMatches = await User.find(preferredQuery).limit(targetNumberOfMatches);
        console.log(preferredMatches)

        allMatches.push(...preferredMatches);

        //If preferred criteria don't yield results, fallback to broader criteria

        if (allMatches.length < targetNumberOfMatches) {

            const ageBasedQuery = {
                _id: { $ne: user._id }, 
                gender: user.interestedIn,
                dateOfBirth: {
                    $gte: fromBirthYear,
                    $lte: toBirthYear
                },
                _id: { $nin: allMatches.map(match => match._id) }  
            };
    
            const ageBasedMatches = await User.find(ageBasedQuery).limit(targetNumberOfMatches - allMatches.length);

            console.log(ageBasedMatches)

            allMatches.push(...ageBasedMatches);
        }


        if (allMatches.length < targetNumberOfMatches) {

            const locationBasedQuery = {
                _id: { $ne: user._id }, 
                gender: user.interestedIn,
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: user.location.coordinates },
                        $maxDistance: maxDistance
                    }
                },
                _id: { $nin: allMatches.map(match => match._id) }
            };
    
            const locationBasedMatches = await User.find(locationBasedQuery).limit(targetNumberOfMatches - allMatches.length);

            allMatches.push(...locationBasedMatches);
        }
        
        const matchesToSend = allMatches.slice(0, targetNumberOfMatches)

        if (matchesToSend.length === 0){
            return res.status(200).send({message: 'No Matches found', matches: matchesToSend})
        } else {
            return res.status(200).send({message: 'Matches found', matches: matchesToSend})
        }
        
        // Return up to 25 matches
        //return res.status(200).send({message: 'Error fetching matches', matches: matchesToSend});

        //res.status(200).send(matches);

        //console.log(preferredMatches, ageBasedMatches, locationBasedMatches)

        // Add more filters based on other preferences

       // Execute the query to find potential matches
       //const matches = await User.find(query); // Limit the number of matches
       //console.log(matches)

        // Optionally, transform the matches to remove sensitive information before sending them to the client
        // const sanitizedMatches = matches.map(match => {
        //     const { sensitiveData, ...publicData } = match.toObject();
        //     return publicData;
        // });

        // console.log(sanitizedMatches, 'sanitized match')

        //res.status(200).send(matches);

    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).send({ message: 'Error fetching matches' });
    }
});


module.exports = router;