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

Use the Firebase Emulator Suite for local Authentication, Firestore, and Storage. Starting the website with `npm run dev:emulator` selects the emulator connections automatically.

## First-time setup

1. Install Node.js 22 (22.13 or later) and JDK 21 or later.
2. Check that your terminal selects the required versions:

   ```sh
   node --version
   java -version
   ```

3. From the repository root, install the website dependencies and local Firebase CLI:

   ```sh
   npm ci
   npm run setup:emulator
   ```

## Start local development

1. Start the Firebase emulators in one terminal:

   ```sh
   npm run emulate
   ```

   Wait for **All emulators ready**.

2. Open another terminal in the repository root and start the website in emulator mode:

   ```sh
   npm run dev:emulator
   ```

3. Open [the website](http://localhost:3000) and [the Emulator UI](http://127.0.0.1:4000). If Next.js prints a different website port, use its printed URL.

The commands supply demo configuration for project `demo-aproject`, including when a hosted `.env` exists. Auth, Firestore, and Storage listen on `127.0.0.1` at ports 9099, 8080, and 9199. Keep those ports and UI port 4000 free.

Use `npm run dev:emulator` for this workflow. Plain `npm run dev` uses the configured hosted Firebase project unless the emulator flag is explicitly enabled.

## Test accounts and local data

Create an account through the website. To grant local admin access, sign out, open **Firestore → users → your UID** in the Emulator UI, change `access` to `admin`, and sign in again.

Press Ctrl+C in each terminal to stop the website and emulators. Wait for the emulator export to finish. The next start imports the saved data from the ignored `emulator/` directory.

GitHub issue creation from feedback is disabled in emulator mode. Local Storage rules are workflow fixtures and do not verify hosted Storage permissions.

## Run the integration check

Stop any running emulator suite, then run:

```sh
npm run test:emulator
```

This starts a fresh suite, checks local Auth, Firestore, and Storage operations, and shuts it down without importing or exporting your saved local data.

To set which subjects graders can grade, see [docs/grader-subjects.md](docs/grader-subjects.md).


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
