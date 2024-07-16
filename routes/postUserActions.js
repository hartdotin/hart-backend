// Assume we have Mongoose models defined for User and Action
const express = require("express");
const Action = require("../model/userAction");
const { CodeBuild } = require("aws-sdk");
const router = express.Router();
const admin = require("firebase-admin");
const serviceAccount = require("../realate-dating-firebase-adminsdk-3vzse-f5465697cd.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
// Endpoint to handle user actions (like, remove, report)
router.post("/", async (req, res) => {
  const { firebaseUid, targetFirebaseUid, actionType, reply, prompts } =
    req.body;
  console.log(req.headers);
  //console.log(req.user.firebaseUid)
  // Retrieved from the authenticated user session

  try {
    // let action = await Action.findOne({ firebaseUid, targetFirebaseUid });

    // if (action) {
    //   // If the action exists, update it with the new actionType, reply, and prompts
    //   action.actionType = actionType;
    //   action.reply = reply;
    //   action.prompts = prompts;
    //   action.timestamp = new Date(); // Update the timestamp to reflect the modification time
    // } else {
    // If the action does not exist, create a new one

    // }
    const action = new Action({
      firebaseUid,
      targetFirebaseUid,
      actionType,
      reply,
      prompts,
      timestamp: new Date(),
    });

    // await action.save();

    // If the action is a "like", update the target user's likesReceived
    if (action.actionType === "like") {
      await updateLike(action)
        .then(() => {
          console.log("Like added");
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
    res
      .status(200)
      .json({ message: `Action ${actionType} performed successfully.` });
  } catch (error) {
    console.error("Error performing action:", error);
    res.status(500).json({ message: "Error performing action" });
  }
});

// Define an async function
async function updateLike(action) {
  try {
    const docRef = db.collection("LikedUsers").doc(action.targetFirebaseUid);
    docValue = await docRef.get();

    console.log("Document data: " + JSON.stringify(docValue.data()));
    const hideList = docValue.data().Hide;
    const showList = docValue.data().Show;
    const hidelen = hideList.length;
    const showlen = showList.length;

    if (hidelen === 0) {
      if (showlen < 25) {
        showList.push(action.firebaseUid);
        docRef.update({
          Show: showList,
        });
      } else {
        hideList.push(action.firebaseUid);
        docRef.update({
          Hide: hideList,
        });
      }
    } else if (hideList < 35) {
      hideList.push(action.firebaseUid);
      docRef.update({
        Hide: hideList,
      });
    } else {
    }
  } catch (error) {
    console.log("Error Occured: ", error);
    throw error;
  }
}
module.exports = router;
