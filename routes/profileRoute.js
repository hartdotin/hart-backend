// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const User = require("../model/user");
const MatchLists = require("../model/matchList");
const Action = require("../model/userAction");
const userResponse = require("../model/userResponse");
const { admin } = require("../utils/sendNotification");
require("dotenv").config();
const db = admin.firestore();

router.put("/update/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params; // Get firebaseUid from URL params
    if (!firebaseUid) {
      return res.status(400).json({ message: "firebaseUid is required" });
    }
    const updateData = req.body; // Get the updated data from the request body
    if (!updateData || Object.keys(updateData).length == 0) {
      return res.status(400).json({ message: "No update data provided" });
    }
    // Find the user by firebaseUid and update the document
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid }, // Find by firebaseUid
      { $set: updateData }, // Update the fields from the request body
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    // Check if the user exists
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the updated user
    return res.status(200).json(updatedUser);
  } catch (error) {
    // Handle errors
    return res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
});

router.delete("/delete/:firebaseUid", async (req, res) => {
  try {
    const { firebaseUid } = req.params; // Get firebaseUid from URL params
    // admin.app().delete(firebaseUid)
    if (!firebaseUid) {
      return res.status(400).json({ message: "firebaseUid is required" });
    }

    // Find the user by firebaseUid and update the document
    const updatedUser = await User.findOneAndDelete(
      { firebaseUid } // Find by firebaseUid
    );
    await Action.findOneAndDelete({
      targetFirebaseUid: firebaseUid,
    });
    await Action.findOneAndDelete({
      firebaseUid: firebaseUid,
    });

    const existingMatch = await MatchLists.findOne({
      matchedIds: { $in: [firebaseUid] },
    });

    if (existingMatch) {
      // Delete the match where firebaseUid exists
      await MatchLists.deleteOne({ _id: existingMatch._id });

      console.log(`Account with UID ${firebaseUid} has been deleted.`);
    } else {
      console.log("No matching account found.");
    }

    // Check if the user exists
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the updated user
    return res.status(200).json(updatedUser);
  } catch (error) {
    // Handle errors
    return res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
});

module.exports = router;
