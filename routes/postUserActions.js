// Assume we have Mongoose models defined for User and Action
const express = require('express');
const Action = require('../model/userAction');
const router = express.Router();
// Endpoint to handle user actions (like, remove, report)
router.post('/', async (req, res) => {
    const { firebaseUid, targetFirebaseUid, actionType, reply, prompts } = req.body;
    console.log(req.body)
    //console.log(req.user.firebaseUid)
    // Retrieved from the authenticated user session
  
    try {
        let action = await Action.findOne({ firebaseUid, targetFirebaseUid });

        if (action) {
          // If the action exists, update it with the new actionType, reply, and prompts
          action.actionType = actionType;
          action.reply = reply;
          action.prompts = prompts;
          action.timestamp = new Date(); // Update the timestamp to reflect the modification time
        } else {
          // If the action does not exist, create a new one
          action = new Action({
            firebaseUid,
            targetFirebaseUid,
            actionType,
            reply,
            prompts,
            timestamp: new Date(),
          });
        }

      await action.save();

      // If the action is a "like", update the target user's likesReceived
      if (actionType === 'like') {
        await User.updateOne(
            { firebaseUid: targetFirebaseUid }, 
            { $addToSet: { likesReceived: firebaseUid } } // Use $addToSet to avoid duplicates
        );
      }
      res.status(200).json({ message: `Action ${actionType} performed successfully.` });
    } catch (error) {
      console.error('Error performing action:', error);
      res.status(500).json({ message: 'Error performing action' });
    }
});


module.exports = router;
  
  