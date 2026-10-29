import readline from "readline";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import "../src/config/env.mjs";
import env from "../src/config/env.mjs";
import User from "../src/models/User.mjs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

const createAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    console.log("\n=== LuxuryStay Initial Admin Setup ===\n");

    const firstName = await ask("First Name: ");
    const lastName = await ask("Last Name: ");
    const email = await ask("Email: ");
    const phone = await ask("Phone: ");
    const password = await ask(
      "Password (min 8 chars): "
    );

    if (password.length < 8) {
      throw new Error(
        "Password must be at least 8 characters"
      );
    }

    const existingAdmin =
      await User.findOne({ role: "Admin" });

    if (existingAdmin) {
      throw new Error(
        "An Admin already exists. Create additional Admins from the Admin Dashboard."
      );
    }

    const existingUser =
      await User.findOne({
        email: email.toLowerCase(),
      });

    if (existingUser) {
      throw new Error(
        "This email is already registered"
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: "Admin",
      isActive: true,
      emailVerified: true,
      mustSetPassword: false,
    });

    console.log(
      "\nInitial Admin created successfully."
    );
  } catch (error) {
    console.error(
      `\nAdmin Setup Error: ${error.message}`
    );
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
};

createAdmin();