const express = require("express");
const { sendNotification } = require("../utils/sendNotification");
const router = express.Router();

router.post("/send", (req, res) => {
  const { token, title, body } = req.body;
  console.log(req.body);
  if (!token || !title) {
    return res
      .status(400)
      .send({ message: "token, title, and body are required" });
  }
  sendNotification(token, title, body ?? "");
  res.json("notification sent");
});

module.exports = router;
