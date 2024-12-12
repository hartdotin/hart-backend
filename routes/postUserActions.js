// Assume we have Mongoose models defined for User and Action
const express = require("express");
const Action = require("../model/userAction");
const router = express.Router();
const User = require("../model/user");
const MatchLists = require("../model/matchList");
const { default: axios } = require("axios");
const { sendNotification } = require("../utils/sendNotification");

// Endpoint to handle user actions (like, remove, report)

router.post("/", async (req, res) => {
  const { firebaseUid, targetFirebaseUid, actionType, reply, prompts } =
    req.body;
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
    if (actionType === "like") {
      await User.updateOne(
        { firebaseUid: targetFirebaseUid },
        { $addToSet: { likesReceived: firebaseUid } } // Use $addToSet to avoid duplicates
      );

      const targetUser = await User.findOne({ firebaseUid: targetFirebaseUid });
      const liker_User = await User.findOne({ firebaseUid: firebaseUid });
      if (targetUser && targetUser.fcmToken) {
        // Send a notification to the target user
        await sendNotification(
          targetUser.fcmToken,
          "New Like!",
          `${liker_User.name} just liked your profile!`
        );
      }
    }
    res
      .status(200)
      .json({ message: `Action ${actionType} performed successfully.` });
  } catch (error) {
    console.error("Error performing action:", error);
    res.status(500).json({ message: "Error performing action" });
  }
});

router.get("/:firebaseUid", async (req, res) => {
  const { firebaseUid } = req.params; // Extract firebaseUid from URL parameters
  // console.log(req.params);

  // Retrieved from the authenticated user session

  try {
    if (!firebaseUid) {
      return res.status(400).send({ message: "firebaseUid is required" });
    }

    let action = await Action.find({
      targetFirebaseUid: firebaseUid,
    });
    if (action.length === 0) {
      console.log("No actions found for the given firebaseUid.");
      return res.status(200).json([]);
    }

    const users = await Promise.all(
      action.map(async (action) => {
        // Find user by firebaseUid
        const user = await User.findOne({
          firebaseUid: action.firebaseUid,
        });
        return { user, action };
      })
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Error performing action:", error);
    res.status(500).json({ message: "Error performing action" });
  }
});
router.delete("/:firebaseUid", async (req, res) => {
  const { firebaseUid } = req.params; // Extract firebaseUid from URL parameters
  // console.log(req.params);

  // Retrieved from the authenticated user session

  try {
    if (!firebaseUid) {
      return res.status(400).send({ message: "firebaseUid is required" });
    }

    let action = await Action.findOneAndDelete({
      targetFirebaseUid: firebaseUid,
    });

    res.status(200).json(action);
  } catch (error) {
    console.error("Error performing action:", error);
    res.status(500).json({ message: "Error performing action" });
  }
});
// Route to handle when two users are matched
router.post("/match", async (req, res) => {
  const { firebaseUid1, firebaseUid2 } = req.body;
  try {
    // Retrieve both users' FCM tokens
    const user1 = await User.findOne({ firebaseUid: firebaseUid1 });
    const user2 = await User.findOne({ firebaseUid: firebaseUid2 });
    const likedData = await Action.findOne({
      firebaseUid: firebaseUid2,
      targetFirebaseUid: firebaseUid1,
    });
    if (!likedData) {
      return res.status(404).send({ message: "Liked Data Not Found" });
    }
    const existingMatch = await MatchLists.findOne({
      matchedIds: { $all: [firebaseUid1, firebaseUid2] },
    });

    if (existingMatch) {
      return res.status(400).send({ message: "Match already exists." });
    }

    const match = new MatchLists({
      matchedIds: [firebaseUid1, firebaseUid2],
      likedDataId: likedData?._id,
    });

    await match.save();
    await Action.findOneAndDelete({
      targetFirebaseUid: firebaseUid1,
    });
    // // Send notifications to both users
    // if (user1 && user1?.fcmToken) {
    //   await sendNotification(
    //     user1.fcmToken,
    //     "It's a Match!",
    //     "You've matched with someone!"
    //   );
    // }

    if (user2 && user2?.fcmToken) {
      await sendNotification(
        user2.fcmToken,
        "It's a Match!",
        "You've matched with someone!"
      );
    }

    res.status(200).json({ message: "Users matched successfully." });
  } catch (error) {
    console.error("Error matching users:", error);
    res.status(500).json({ message: "Error matching users" });
  }
});

router.get("/match/:firebaseUid", async (req, res) => {
  const { firebaseUid } = req.params;
  if (!firebaseUid) {
    return res.status(400).send({ message: "firebaseUid is required" });
  }

  try {
    // Retrieve both users' FCM tokens
    // const user1 = await MatchLists.find({
    //   $or: [{ firebaseUid1: firebaseUid }, { firebaseUid2: firebaseUid }],
    // }).populate("firebaseUid1");
    const user1 = await MatchLists.find({ matchedIds: { $in: [firebaseUid] } });

    if (user1.length === 0) {
      return res
        .status(404)
        .send({ message: "No matches found for this user." });
    }
    const userIds = user1
      .map((match) => match?.matchedIds)
      .flat()
      .filter((i) => i !== firebaseUid);
    // Now, fetch the corresponding User documents
    const users = await User.find({ firebaseUid: { $in: userIds } });
    // Map the users back to their corresponding match lists
    const result = user1.map((match) => {
      const user = users.find((user) =>
        match.matchedIds.includes(user.firebaseUid)
      );
      return {
        ...match.toObject(),
        user, // Populated user data
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error matching users:", error);
    res.status(500).json({ message: "Error matching users" });
  }
});

router.post("/location", async (req, res) => {
  const { firebaseUid, location } = req.body;
  console.log(firebaseUid, location);

  if (!firebaseUid || !location || !location.lat || !location.long) {
    return res.status(400).send({
      message: "firebaseUid and valid location (lat, long) are required",
    });
  }
  // Mapbox API for reverse geocoding
  const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.long},${location.lat}.json?access_token=${process.env.MAPBOX_API}`;

  try {
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if latitude and longitude have significantly changed before updating
    const latChanged =
      !user.location.coordinates ||
      location.lat !== user.location.coordinates[1];
    const longChanged =
      !user.location.coordinates ||
      location.long !== user.location.coordinates[0];

    if (latChanged || longChanged) {
      // Fetching new address from Mapbox
      const response = await axios.get(mapboxUrl);
      try {
        if (
          response.data &&
          response.data.features &&
          response.data.features.length > 0
        ) {
          //console.log(response.data.features)

          // Extracting the address
          const address = response.data.features[0].place_name;
          const locality = response.data.features.find(
            (obj) =>
              obj.place_type == "locality" || obj.place_type == "neighborhood"
          )?.text;
          const place = response.data.features.find(
            (obj) => obj.place_type == "place"
          )?.text;
          // Updating user's location and address
          user.location = {
            type: "Point",
            coordinates: [location.long, location.lat],
            address: address, // Assuming your location schema includes an 'address' field
            locality: locality,
            place: place,
          };
        } else {
          console.log("No address found for the given coordinates.");
          // Update location without address if not found
          user.location = {
            type: "Point",
            coordinates: [location.long, location.lat],
          };
        }
      } catch (error) {
        console.error("Failed to fetch address from Mapbox:", error);
        // Consider how to handle partial failure gracefully
      }

      await user.save();
      return res
        .status(200)
        .send({ message: "Location and address updated successfully" });
    } else {
      return res.status(200).send({ message: "Location unchanged" });
    }
  } catch (error) {
    console.error("Error updating user location:", error);
    res.status(500).send({ message: "Error updating user location" });
  }
});

module.exports = router;
