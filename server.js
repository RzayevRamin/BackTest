const express = require("express");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3001;


const codes = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "projecttravel1990@gmail.com",
    pass: "cchs cakp qbmy wgxv"
  }
});

app.post("/send-code", (req, res) => {
    console.log("POST /send-code çağırıldı");
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ message: "Email or phone required" });
  }

  const code = Math.floor(1000 + Math.random() * 9000);
  codes[emailOrPhone] = code;

  console.log(`Verification code for ${emailOrPhone}: ${code}`);

  if (emailOrPhone.includes("@")) {
    const mailOptions = {
      from: "sənin.email@gmail.com",
      to: emailOrPhone,
      subject: "Verification Code",
      text: `Your verification code is: ${code}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to send email" });
      } else {
        console.log("Email sent: " + info.response);
        return res.json({ message: "Verification code sent." });
      }
    });
  } else {
    return res.status(400).json({ message: "SMS sending not implemented" });
  }
});

app.post("/verify-code", (req, res) => {
  const { emailOrPhone, code } = req.body;

  if (codes[emailOrPhone] && codes[emailOrPhone].toString() === code) {
    delete codes[emailOrPhone];
    return res.json({ success: true, message: "Code verified" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }
});


app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`User ID: ${userId}`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.use(express.json());

app.use(express.static(path.join(__dirname, "client/build")));