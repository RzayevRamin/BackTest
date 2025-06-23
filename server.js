const express = require("express");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
require("dotenv").config(); // .env faylını yüklə

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 🔐 Firebase Admin SDK - Environment Variable ilə
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

// 🔐 Email göndərmək üçün nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔐 Kodlar müvəqqəti burada saxlanır
const codes = {};

// 📩 Kod göndərmə endpoint
app.post("/send-code", (req, res) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ message: "Email or phone required" });
  }

  const code = Math.floor(1000 + Math.random() * 9000);
  codes[emailOrPhone] = code;

  if (emailOrPhone.includes("@")) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailOrPhone,
      subject: "Verification Code",
      text: `Your verification code is: ${code}`,
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

// ✅ Kod yoxlama endpoint
app.post("/verify-code", (req, res) => {
  const { emailOrPhone, code } = req.body;

  if (codes[emailOrPhone] && codes[emailOrPhone].toString() === code) {
    delete codes[emailOrPhone];
    return res.json({ success: true, message: "Code verified" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }
});

// 🔐 Şifrə sıfırlama endpoint
app.post("/reset-password", async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }

  try {
    const user = await admin.auth().getUserByEmail(emailOrPhone);
    await admin.auth().updateUser(user.uid, { password });
    return res.json({
      success: true,
      message: "Password updated successfully in Firebase.",
    });
  } catch (error) {
    console.error("Firebase password update error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update password.",
    });
  }
});

// 🔧 (Əlavə route nümunəsi)
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  res.send(`User ID: ${userId}`);
});

// 🔗 Frontend statik fayllar üçün
app.use(express.static(path.join(__dirname, "client/build")));

// 🔊 Serveri başlat
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
