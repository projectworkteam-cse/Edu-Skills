# Complete Guide: Firebase Firestore Database Rules

This guide explains **Firestore Security Rules** in simple, clear language: what they are, why your app needs them, how to publish them in your Firebase Console, and a line-by-line explanation of your project's rules file.

---

## 1. What Are Firestore Security Rules?

When you build a web application, your JavaScript code runs inside the user's browser. Anyone who opens the developer tools (F12) can see the code and could theoretically try to send requests directly to your database.

**Firestore Security Rules are your database's bodyguard.**
They run directly on Google Cloud's servers, completely separate from the user's browser. Every time anyone tries to read or write data, Google checks these rules first:
- If the rule says **ALLOW** -> The database returns or saves the data.
- If the rule says **DENY** -> Google blocks the request immediately with `Permission Denied`.

---

## 2. Why Are These Rules Critical for EDU-SKILL'S AI?

Without these rules:
1. **Data Leak Risk**: Student A could open developer tools and read Student B's study notes, exam schedules, and grades.
2. **Data Tampering Risk**: Anyone could delete another student's timetable or overwrite their subjects.
3. **Email Harvesting**: A bot could download every student's email address by listing all user profiles.

With our security rules in place:
1. **100% Privacy**: Each student can **only** read and write their own data.
2. **Ownership Enforcement**: Even if someone knows another student's ID, Google blocks them.
3. **Anti-Harvesting**: Scrapers cannot list all registered usernames or emails.

---

## 3. How to Copy-Paste and Publish These Rules (Step-by-Step)

Follow these simple steps:

1. Open your web browser and go to the **[Firebase Console](https://console.firebase.google.com/)**.
2. Click on your project: **`eduskillai-3e807`**.
3. In the left-hand navigation sidebar, click on **Build** -> **Firestore Database**.
4. At the top of the Firestore page, click on the **Rules** tab.
5. In your code editor, open the file: **[`firestore.rules`](file:///c:/Users/manoj/OneDrive/Documents/Hrushi%20clg%20project/Eduskills/Eduskills/firestore.rules)**.
6. Copy everything inside `firestore.rules`.
7. Back in the Firebase Console, select all the text in the rules editor, delete it, and paste your copied rules.
8. Click the blue **Publish** button in the top right.

> You are done! The rules take effect on Google's servers within a few seconds.

---

## 4. Line-by-Line Explanation of Your `firestore.rules`

Here is what every block of code in [`firestore.rules`](file:///c:/Users/manoj/OneDrive/Documents/Hrushi%20clg%20project/Eduskills/Eduskills/firestore.rules) does:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
```
> **Explanation**: This tells Firebase to use the modern Version 2 rule engine for all documents in your database.

---

### Rule 1: The Student Private Folder (`/users/{userId}`)

```javascript
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
```
> **What this means**:
> - `request.auth != null`: The person making the request **must be logged in**. Strangers who are not logged in get blocked instantly.
> - `request.auth.uid == userId`: The logged-in person's unique Firebase ID (`uid`) **must match the folder ID (`userId`)**.
>   - For example, if your student UID is `usr_12345`:
>     - You CAN read and write `/users/usr_12345/app/state` (your timetable, tasks, notes).
>     - You CANNOT touch `/users/usr_99999/app/state` (another student's folder). Google blocks it.

---

### Rule 2: The Username Registry (`/usernames/{username}`)

```javascript
    match /usernames/{username} {
      allow get: if true;
      allow list: if false;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && username.matches('^[a-z0-9_]{3,20}$');
      allow update, delete: if request.auth != null
                    && resource.data.uid == request.auth.uid
                    && (request.method == 'delete' || request.resource.data.uid == resource.data.uid);
    }
```
> **What this means**:
> - This collection lets students log in using their **username** (e.g. `alex_smith`) instead of having to type their full email every time.
> - `allow get: if true;`: When someone types `alex_smith` on the login screen, the app is allowed to look up that **single** username to find the email address.
> - `allow list: if false;`: **Crucial security protection**. Nobody can ask Firebase for a list of *all* users. This stops bots from stealing all students' emails!
> - `allow create`: When creating an account, you must be logged in, you can only link the username to your own UID, and the username must be valid (3 to 20 letters, numbers, or underscores).
> - `allow update, delete`: Only the student who originally registered the username is allowed to edit or delete it.

---

### Rule 3: The "Default Deny" Safety Net

```javascript
    match /{document=**} {
      allow read, write: if false;
    }
```
> **What this means**:
> - This is the ultimate security guarantee.
> - Anything in the database that is not explicitly permitted by Rule 1 or Rule 2 is **100% blocked**.
> - Nobody can create random collections, and no unauthorized data can ever leak.

---

## 5. Summary Table

| Collection | Path in Database | Who Can Read? | Who Can Write? | Why It's Safe |
|---|---|---|---|---|
| **User Data** | `users/{userId}` | Only the owner (`auth.uid == userId`) | Only the owner (`auth.uid == userId`) | Complete student privacy. |
| **App State** | `users/{userId}/app/state` | Only the owner | Only the owner | Syncs notes, exams, timetable safely. |
| **Username Registry** | `usernames/{username}` | Single lookup only (`get`) | Only the owner who claimed it | Allows username login without email harvesting. |
| **All Other Collections** | Any other path | Blocked (`false`) | Blocked (`false`) | No unauthorized access possible. |
