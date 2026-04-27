# Playto KYC Pipeline - Simple Explainer

This document explains the core parts of the Playto KYC (Know Your Customer) project in simple terms.

## 1. The State Machine (Status Tracking)
Every KYC application has a status (like `draft`, `submitted`, `under_review`, `approved`, `rejected`). 
We use a rulebook called a "State Machine" to ensure applications can only move in allowed directions. For example, an application can't go straight from `draft` to `approved` without being `submitted` first. This keeps the process strict and prevents errors.

## 2. Secure File Uploads
When users upload documents (like PAN or Aadhaar), we don't just trust the file name (e.g., `.jpg`). 
Instead, we check the actual "magic bytes" (the hidden signature inside the file content) to make sure a `.jpg` is really an image and not a disguised virus. We also check the file size immediately to block excessively large files.

## 3. The Reviewer Queue
Reviewers see a list of submitted applications. The system automatically sorts them so the oldest ones are handled first (First-In, First-Out). It also highlights applications that have been waiting too long (e.g., over 24 hours), so reviewers know which ones are urgent.

## 4. Security & Privacy
Merchants can only see their own KYC applications. We use secure login tokens to identify who is making a request. The system strictly separates "Merchants" (who apply) from "Reviewers" (who approve/reject), ensuring a merchant can never access another merchant's sensitive data.

## 5. Face Verification (Face ID)
To prove their identity, merchants must take a live selfie. The frontend handles the camera capture securely. To make sure no data is lost if their connection drops, the selfie is saved locally and only uploaded together with the final application submission.

## 6. Light and Dark Mode (Theming)
The app features a premium design that supports both Light and Dark modes. We took special care to ensure all parts of the app—even tricky things like browser dropdown menus—match the theme perfectly for a seamless user experience.
