#!/usr/bin/env bash
# This script was originally designed to start a Docker container for a local development database.
# Since Firebase is a cloud service, it doesn't require running a local container.
# This script will now check the Firebase configuration and provide instructions for setup.

# TO RUN ON WINDOWS:
# 1. Install WSL (Windows Subsystem for Linux) - https://learn.microsoft.com/en-us/windows/wsl/install
# 2. Install Docker Desktop for Windows if you still need Docker for other purposes - https://docs.docker.com/docker-for-windows/install/
# 3. Open WSL - `wsl`
# 4. Run this script - `./start-firebase.sh`

# On Linux and macOS, you can run this script directly - `./start-firebase.sh`

# Import env variables from .env
set -a
source .env

# Check if Firebase CLI is installed
if ! [ -x "$(command -v firebase)" ]; then
  echo -e "Firebase CLI is not installed. Please install Firebase CLI and try again.\nFirebase CLI install guide: https://firebase.google.com/docs/cli"
  exit 1
fi

# Check if the Firebase configuration file exists
if [ ! -f ".firebaserc" ]; then
  echo "Firebase configuration file (.firebaserc) is missing."
  echo "Please run 'firebase init' to initialize your Firebase project."
  exit 1
fi

# Validate environment variables required for Firebase
REQUIRED_VARS=("NEXT_PUBLIC_FIREBASE_API_KEY" "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "NEXT_PUBLIC_FIREBASE_APP_ID" "FIREBASE_ADMIN_PROJECT_ID" "FIREBASE_ADMIN_PRIVATE_KEY" "FIREBASE_ADMIN_CLIENT_EMAIL")

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "Environment variable $VAR is not set. Please check your .env file."
    exit 1
  fi
done

echo "Firebase configuration appears to be correct."

# Optionally, check Firebase authentication
read -p "Would you like to check Firebase authentication setup? [y/N]: " -r REPLY
if [[ $REPLY =~ ^[Yy]$ ]]; then
  firebase login
  if [ $? -ne 0 ]; then
    echo "Firebase authentication failed. Please try logging in again."
    exit 1
  fi
fi

echo "Firebase setup complete. You can now use Firebase services in your application."

# Additional information or commands can be added here as needed
