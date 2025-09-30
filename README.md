# 🇩🇪 Flashcard Deutscher - Modern German Learning App

**Instagram-Style Mobile-First German Flashcard Application with Advanced SRS Intelligence**

Flashcard Deutscher is a modern, mobile-optimized flashcard application featuring over **2,000 German words** with intelligent spaced repetition, multiple study modes, and a sleek Instagram-inspired interface designed for effective German language learning.

## ✨ Key Features

### 🧠 **Advanced Spaced Repetition System (SRS)**
- **Smart Algorithm**: SuperMemo SM-2 based intelligent scheduling
- **Dynamic Difficulty**: Adaptive intervals based on performance
- **Quality Ratings**: 4-level feedback system (Again, Hard, Good, Easy)
- **Due Card Prioritization**: Overdue and due cards prioritized across all modes
- **Persistent Learning**: Study mode and progress saved automatically

### 📱 **Instagram-Style Mobile Interface**
- **Mobile-First Design**: Optimized for touch and swipe interactions
- **Full-Screen Cards**: Immersive single-card focus experience
- **Responsive Layout**: Perfect on mobile, tablet, and desktop
- **Material Design**: Modern icons and smooth animations
- **Dark/Light Themes**: Automatic theme switching with localStorage persistence

### 🎯 **Intelligent Study Modes**
- **Smart Random (SRS)**: Intelligent mixing of due, overdue, and new words
- **New Words (SRS)**: Systematic introduction of fresh vocabulary
- **Viewed Words (SRS)**: Review cards you've seen with SRS prioritization  
- **Difficult Words (SRS)**: Focus on challenging vocabulary with mistake-based ordering
- **Learned Words (SRS)**: Maintenance review of mastered vocabulary
- **Browse & Search**: Explore all 2000+ words with advanced filtering

### 📊 **Comprehensive Progress Tracking**
- **Real-Time Statistics**: Live progress with due/overdue counters
- **Learning Analytics**: Track new, learning, difficult, and learned words
- **Session Tracking**: Monitor study time and performance per session
- **Visual Progress**: Color-coded status indicators and progress cards
- **Export Ready**: Data stored in localStorage for analysis

### 🔍 **Advanced Browse & Search**
- **Dedicated Search Page**: Full-screen browse experience with modal design
- **Smart Filtering**: Search by German/English words with language toggles
- **Word-Only Search**: Focused vocabulary search excluding sentences
- **Instant Results**: Real-time filtering with status badges
- **Mobile Optimized**: Touch-friendly interface with smooth animations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd deutsch-flasher-scrollview
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎮 How to Use

### 📚 **Study Session**
1. **Select Study Mode**: Choose from 5 intelligent SRS-powered modes
2. **View Flashcard**: Read German word, article, and example sentence
3. **Flip to Answer**: Tap card or press Space to reveal English meaning
4. **Rate Performance**: Use quality buttons to rate your recall:
   - **Again (0)**: Complete miss - didn't remember at all
   - **Hard (1)**: Difficult recall - got it wrong but remembered with effort
   - **Good (2)**: Normal recall - correct answer with some thinking
   - **Easy (3)**: Perfect recall - instant and effortless

### 🔍 **Browse & Search**
1. **Access Search**: Tap the search icon in the header
2. **Filter by Language**: Toggle between German, English, or Both
3. **Search Words**: Type to find specific vocabulary (excludes sentences)
4. **View Details**: Tap any card to see full information
5. **Quick Navigation**: Use the modal design for easy browsing

### ⚙️ **Settings & Customization**
1. **Progress Overview**: View comprehensive learning statistics
2. **Study Modes**: See detailed descriptions of each SRS mode
3. **Theme Toggle**: Switch between light and dark modes
4. **Data Reset**: Clear all progress and start fresh
5. **Collapsible Info**: Expand mode descriptions for detailed explanations

## 🛠️ Technology Stack

### Frontend Framework
- **React 18.2.0**: Modern hooks-based architecture
- **Material Icons**: Consistent iconography system
- **Custom CSS**: Mobile-first responsive design
- **UUID**: Unique identifier generation for cards

### Data & Storage
- **JSON Dataset**: 2000+ curated German words with context
- **LocalStorage**: Persistent data storage for offline use
- **State Management**: React hooks for complex state handling

### SRS Algorithm
- **Custom Implementation**: Advanced spaced repetition calculations
- **SM-2 Based**: Scientific approach to memory retention
- **Statistics Tracking**: Comprehensive learning analytics

## 📁 Project Structure

```
src/
├── InstagramView.jsx           # Main application component
├── InstagramView.css          # Primary styles and themes
├── srsAlgorithm.js           # Spaced repetition calculations
├── statisticsManager.js       # Learning analytics and tracking
├── components/
│   ├── SettingsPanel.jsx      # Settings and study mode selection
│   ├── BrowsePage.jsx         # Advanced search and browse functionality
│   ├── BurgerMenu.jsx         # Mobile navigation menu
│   ├── SearchButton.jsx       # Header search button
│   ├── FullScreenCard.jsx     # Individual flashcard component
│   └── BrowsePage.css         # Browse page specific styles
├── data/
│   └── initialWords.json      # 2000+ German vocabulary dataset
└── App.css                    # Global application styles

public/
├── index.html                 # Application entry point
└── ...

package.json                   # Dependencies and scripts
```

## 🎨 Design Features

### Color Scheme & Themes
- **Smart Random**: Purple gradient for intelligent features
- **New Words**: Green gradient for fresh content
- **Learning**: Cyan gradient for active learning
- **Difficult**: Red gradient for priority/difficulty
- **Learned**: Green gradient for mastery
- **Consistent Theming**: All colors work in light/dark modes

### User Experience
- **Instant Feedback**: Visual confirmation for all interactions
- **Smooth Animations**: Keyframe animations for state changes
- **Touch Optimized**: Large touch targets and gesture support
- **Accessibility**: High contrast ratios and semantic HTML
- **Progressive Enhancement**: Core functionality works without JavaScript

## 📊 Data Structure

Each flashcard contains comprehensive learning metadata:

```javascript
{
  id: "unique-uuid",
  word: "lernen",
  article: "das",
  type: "verb",
  sentence: "Ich lerne Deutsch jeden Tag.",
  meaning: "to learn",
  sentenceMeaning: "I learn German every day.",
  
  // SRS Learning Data
  status: "learning",          // null, "learning", "learned", "review"
  nextReview: "2025-09-30",    // ISO date string
  interval: 3,                 // Days until next review
  easeFactor: 2.1,            // Difficulty multiplier (1.3-2.5+)
  consecutiveCorrect: 2,       // Streak of correct answers
  
  // Analytics & History
  totalReviews: 7,            // Total times studied
  mistakeCount: 2,            // Number of incorrect answers
  lastReviewed: "2025-09-27", // Last study session
  createdDate: "2025-09-20",  // First encounter date
  count: 0                    // Legacy counter
}
```

## 🔧 Customization

### Adding New Words
1. **Edit Dataset**: Modify `src/data/initialWords.json`
2. **Required Fields**: word, article, type, sentence, meaning, sentenceMeaning
3. **Optional Fields**: category, level (for future categorization)
4. **Restart App**: Refresh to load new vocabulary

### SRS Algorithm Tuning
- **Modify Parameters**: Edit `src/srsAlgorithm.js`
- **Adjust Intervals**: Change base interval calculations
- **Difficulty Factors**: Modify ease factor adjustments
- **Quality Thresholds**: Customize rating impact

### Styling Customization
- **CSS Variables**: Modify theme colors in `src/App.css`
- **Component Styles**: Edit individual component CSS
- **Responsive Breakpoints**: Adjust mobile/desktop transitions
- **Animation Timing**: Customize transition durations

## 🤝 Contributing

We welcome contributions to improve Flashcard Deutscher:

### Areas for Contribution
- **New Features**: Additional study modes, gamification, audio support
- **Bug Fixes**: UI improvements, algorithm refinements
- **Vocabulary**: Expanding the German word dataset
- **Localization**: Supporting additional interface languages
- **Testing**: Unit tests, integration tests, user testing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile and desktop
5. Submit a pull request with detailed description

## 📄 License & Usage Rights

### 🔓 **Software Code (MIT License)**
The application code, components, and algorithms are available under the **MIT License** - feel free to use, modify, and learn from the code for any purpose.

### 📚 **German Vocabulary Dataset (Restricted)**
The 2000+ German vocabulary dataset (`src/data/initialWords.json`) is protected under **additional licensing terms**:

#### ✅ **PERMITTED USES:**
- **Personal Learning**: Use for your own German language study
- **Educational Projects**: Non-commercial educational applications  
- **Academic Research**: Study and research purposes
- **Contributing**: Improvements back to this project

#### ❌ **PROHIBITED USES:**
- **Commercial Products**: Cannot be used in commercial language learning apps
- **Resale/Redistribution**: Cannot be sold or redistributed commercially
- **Competitive Products**: Cannot be used to create competing commercial platforms
- **Attribution Removal**: Must maintain copyright notices

#### 💼 **Commercial Licensing Available**
Interested in using our vocabulary dataset commercially? We offer licensing for:
- Educational technology companies
- Language learning platforms  
- Corporate training applications

**Contact**: @atj393 on GitHub for commercial licensing inquiries.

#### 📝 **Attribution Required**
Any use must include: *"German vocabulary dataset courtesy of Flashcard Deutscher project by Alexis T. Jackson"*

### 🛡️ **Why This Approach?**
This vocabulary dataset represents significant effort in curating high-quality German learning content. We want to encourage learning and education while protecting against commercial exploitation.

**Full license details**: See [LICENSE](LICENSE) file.

## 🎯 Future Roadmap

### Phase 1: Enhanced Learning
- **Word Categorization**: 10 thematic categories for focused learning
- **Audio Pronunciation**: Native speaker audio for all vocabulary
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Advanced Statistics**: Detailed learning curve analysis

### Phase 2: Social & Gamification
- **Achievement System**: Unlockable badges and milestones
- **Study Streaks**: Daily/weekly streak tracking
- **Leaderboards**: Community progress sharing
- **Custom Decks**: User-created vocabulary sets

### Phase 3: Intelligence & Automation
- **AI-Powered Recommendations**: Personalized study suggestions
- **Adaptive Learning**: Dynamic difficulty adjustment
- **Speech Recognition**: Pronunciation practice and feedback
- **Multi-Language Support**: Spanish, French, Italian expansion

---

**Flashcard Deutscher** - Experience the future of German language learning with intelligent SRS, beautiful design, and comprehensive progress tracking. 🚀

*Built with ❤️ for German language learners worldwide.*

### 📈 App Statistics
- **2,000+ Words**: Comprehensive German vocabulary
- **5 Study Modes**: All powered by intelligent SRS
- **Mobile-First**: Optimized for modern touch devices  
- **100% Offline**: Works completely without internet
- **Open Source**: MIT licensed for community development