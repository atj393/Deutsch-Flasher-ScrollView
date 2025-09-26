German Flashcard App - Developer Instructions

This app is a local React-based flashcard system to help a user learn 1500+ German words with example sentences. It supports keyboard navigation, flip-to-translate, learning status tracking, and word progress counters.

🎯 Goal

Create a simple flashcard app that can be run locally to:

Learn German vocabulary through flashcards.

Track each word's status: new, learning, or learned.

Show example sentence for each word and its English translation.

Allow user to interact with flashcards using keyboard shortcuts.

Store all data in the browser (localStorage) for persistence.

🧠 Word Data Structure

The words are stored in a JSON array like this:

{
  word: 'lernen', // German word
  sentence: 'Ich lerne Deutsch.', // Sentence in German
  meaning: 'to learn', // English translation of the word
  sentenceMeaning: 'I am learning German.', // English sentence
  count: 0, // Number of times this card was shown
  status: 'new' // one of: 'new', 'learning', 'learned'
}

Initially, 10 words are provided for development/testing. The system can easily scale to 1500+.

💡 Features & Controls

🔄 Navigation & Interaction

Key

Action

← (Left Arrow)

Show previous word

→ (Right Arrow)

Show next word (and increment view counter)

Space

Flip card to show English meaning

↑ (Up Arrow)

Mark current word as learning

↓ (Down Arrow)

Reset current word to new

⏎ (Enter)

Mark current word as learned (will be skipped in future versions)

🧩 App Logic

Startup:

On initial load, app checks for saved flashcard data in localStorage.

If none found, it uses the hardcoded list of initialWords.

Display:

Each card shows:

The German word

A sample sentence

English translations only on flip

Current status

count (how many times shown)

Status Tracking:

Clicking UP or DOWN changes the status for current word.

Clicking ENTER marks the word as learned (future versions will exclude these).

Storage:

All changes to cards are saved in localStorage under the key: flashcards

✅ To Do / Optional Enhancements



🚀 Running the App Locally

Clone/download the project.

Ensure Node.js is installed.

Run:

npm install
npm start

Open browser at http://localhost:3000

📁 File Structure (Initial)

FlashCardApp.jsx → Main component

App.css → Styles for card layout

index.js → Entry point (not shown here)

package.json → React project config

🤝 Contribution Guidelines

Use simple, clean code.

Ensure compatibility with modern browsers.

Avoid external dependencies unless necessary.

Use localStorage only (no backend required).

🧪 Testing

Load the app.

Try each arrow key and observe correct behavior.

Refresh to ensure changes are saved.

Check localStorage in dev tools to see card states.

📦 Future Expansion

Once basic version is ready, you can:

Load full 1500+ words from a words.json file

Track performance (accuracy, speed)

Create quizzes from learned words

Add spaced repetition algorithm

👨‍💻 Made for Self-learning

This app is designed for language learners who want full control over their study pace and method.

Enjoy building and using it!

If you have questions, refer to FlashCardApp.jsx for core logic or reach out to the original creator.

