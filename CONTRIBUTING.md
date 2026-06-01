# Contributing to FiveHive

Thank you for contributing to FiveHive! We welcome contributions of all sizes, whether it's fixing bugs, improving the UI, writing documentation, or adding new features.

This project is open source and community-driven, so please read the guidelines below before contributing.

---

# Getting Started

## Fork & Clone the Repository

1. Fork the repository on GitHub.
2. Clone your fork locally:

    git clone https://github.com/YOUR_USERNAME/fivehive-website.git

3. Move into the project directory:

    cd fivehive-website

4. Install dependencies:

    npm install

---

# Setting Up Firebase

To run the website locally, you must connect it to your own Firebase project.

## 1. Create a Firebase Project

Go to the Firebase Console and create a new Firebase project.

Create a **Web App** inside the project to access your Firebase configuration values.

## 2. Create a `.env` File

In the root directory of the project, create a file named:

    .env

Add the following environment variables:

    NEXT_PUBLIC_FIREBASE_API_KEY="key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="project-id.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="id"
    NEXT_PUBLIC_FIREBASE_APP_ID="id"

Replace the placeholder values with your Firebase project's credentials.

## 3. Start the Development Server

Run:

    npm run dev

The website should now be available through the localhost URL shown in your terminal.

If the page appears blank initially, try refreshing a few times.

---

# Using Firebase Emulator

We use Firebase Emulator Suite for local backend development and testing.

## 1. Modify `firebase.ts`

Open:

    ./src/lib/firebase.ts

Replace this:

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

With this:

    const app = initializeApp(firebaseConfig);

    const db = getFirestore(app);
    connectFirestoreEmulator(db, "127.0.0.1", 8080);

    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");

Also update your imports:

    import { initializeApp } from "firebase/app";
    import { connectAuthEmulator, getAuth } from "firebase/auth";
    import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

> IMPORTANT: These emulator changes should remain **local only** and should never be committed.

## 2. Install Firebase CLI

    npm install -g firebase-tools

## 3. Initialize Firebase Emulator

Run:

    firebase init

Enable the following emulators:

- Authentication
- Firestore
- Storage

Use the default ports and enable Emulator UI when prompted.

## 4. Start the Emulator

    firebase emulators:start

You should now see emulator warnings locally on the website.

Try creating an account to verify everything is working correctly.

## 5. Granting Admin Access

To test admin functionality locally:

1. Log out of your account
2. Open the Firestore Emulator UI
3. Modify the `access` field for your user document
4. Log back in

If there are any issues with the process above, please tell us, and we'll fix it!

---

# Contribution Guidelines

## Before You Start

Before opening a pull request:

- Check existing issues first
- Avoid duplicate work
- If you plan on making a large change, open an issue first to discuss it

## Issues

We use GitHub Issues to track bugs, improvements, and feature requests.

Good issues should include:

- A clear title
- Steps to reproduce for bugs
- Expected behavior
- Screenshots if applicable
- Relevant logs or errors

If you'd like to work on an issue, comment on it so others know it's being worked on.

## Pull Requests

Please keep pull requests:

- Focused
- Reasonably small
- Linked to an issue whenever possible
- Clearly described

Before submitting a PR:

- Test your changes
- Avoid unrelated refactors
- Make sure the PR title and description are clear

Example:

    Closes #42
    Fixes #18

## Code Style

- Follow the existing project structure and conventions
- Keep components modular and readable
- Use meaningful variable and function names
- Remove unused imports and console logs before submitting

## Commit Messages

Use clear and descriptive commit messages.

Examples:

    fix: resolve navbar mobile overflow
    feat: add admin dashboard analytics card
    docs: improve firebase emulator setup guide

---

# What You Can Contribute

Some areas contributors can work on include:

- Bug fixes
- UI/UX improvements
- Accessibility improvements
- Documentation
- Performance optimizations
- Mobile responsiveness
- Firebase emulator improvements
- Issue and pull request templates
- Refactoring messy components
- New website features

---

# Need Help?

If you run into issues during setup or development, feel free to open an issue and ask for help.

We appreciate every contribution ❤️
