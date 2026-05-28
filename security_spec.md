# Security Spec

## 1. Data Invariants
- A user's document ID must match their authentication ID (`request.auth.uid`).
- A user can only create and read their own user document.
- `createdAt` must be the server time on creation and cannot be changed.
- `updatedAt` must be the server time on update.

## 2. Dirty Dozen Payloads
- **Identity Spoofing**: Attempt to create a user document with a different UID.
- **State Shortcutting**: Skipping required fields like `createdAt`.
- **Resource Poisoning**: Injecting massive strings.
- **Value Poisoning**: Passing a boolean instead of string for `email`.
- **Email Spoofing**: Not verifying the email.

## 3. Test Runner
We will create `firestore.rules.test.ts`.
