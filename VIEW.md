Technical Requirements: Instagram-Style Mobile Flashcard View
Overview
Create a full-screen, mobile-optimized flashcard view that mimics modern social media applications with centered content, bottom-right controls, and no overflow issues.

Detailed Implementation Steps
1. Container Structure
Create a fixed-position container that covers the entire viewport

Set position: fixed
Set top: 0, left: 0, right: 0, bottom: 0
Set width: 100vw, height: 100vh
Apply z-index: 1000 to ensure it appears above other content
Hide scrollbars while maintaining scroll functionality

Add scrollbar-width: none for Firefox
Add -ms-overflow-style: none for IE/Edge
Use ::-webkit-scrollbar { display: none } for Chrome/Safari
2. Card Layout
Implement card wrapper with scroll-snap functionality

Set scroll-snap-align: start to ensure cards snap into position
Apply height: 100vh, width: 100vw for full viewport coverage
Use box-sizing: border-box to include padding in dimensions
Create 3D flip mechanism for cards

Use transform-style: preserve-3d on parent container
Apply backface-visibility: hidden to front and back faces
Implement transform: rotateY(180deg) for the back face
Add transition with transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)
3. Content Positioning
Center all card content vertically and horizontally

Use flexbox: display: flex, flex-direction: column
Set justify-content: center, align-items: center
Apply text-align: center to text elements
Implement proper text hierarchy with mobile-optimized sizes

Primary text (German word): font-size: 48px, font-weight: bold
Secondary text (English translation): font-size: 42px
Tertiary text (sentences): font-size: 22px, opacity: 0.8
Metadata (word type): font-size: 16px, font-style: italic, opacity: 0.6
Add proper spacing between elements

Vertical spacing: margin-bottom: 25px between major sections
Apply line-height: 1.5 for sentence readability
4. Visual Design
Implement gradient backgrounds for visual appeal

Create 5 different gradient variations using radial-gradient
Rotate backgrounds based on card index (:nth-child(5n+1), etc.)
Ensure high contrast with text colors
Add text shadows for better readability

Apply text-shadow: 0 2px 8px rgba(0,0,0,0.3) to light text on dark backgrounds
Use semi-transparent white text (rgba(255,255,255,0.9)) for better contrast
5. Control Positioning and Styling
Create a fixed control panel in bottom-right corner

Set position: fixed, bottom: 40px, right: 20px
Apply z-index: 1001 to appear above card content
Style control buttons with glassmorphism effect

Create circular buttons with width: 60px, height: 60px, border-radius: 50%
Apply semi-transparent background: background: rgba(255,255,255,0.2)
Add blur effect: backdrop-filter: blur(8px)
Include subtle shadow: box-shadow: 0 4px 15px rgba(0,0,0,0.15)
Arrange buttons in vertical column

Use display: flex, flex-direction: column, gap: 20px
Add appropriate icons (thumb up/down, flip, reset)
Implement active states with color changes
6. Overflow Prevention
Apply strict overflow control to all containers

Set overflow: hidden on the card container
Use max-height: 100vh to prevent vertical overflow
Enforce max-width: 100vw to prevent horizontal overflow
Implement content constraints

Set max-width: 90% on sentence containers
Use text-overflow: ellipsis for long text
Consider overflow-wrap: break-word for unusual word lengths
7. Touch Interaction
Implement swipe gestures for card navigation

Use touch events (touchstart, touchmove, touchend)
Calculate swipe direction and distance
Apply threshold to trigger card changes
Add touch feedback on controls

Create active/pressed states for buttons
Use transform: scale(0.95) on :active state
Add transition for smooth animation: transition: all 0.2s ease
8. Responsive Adjustments
Add media queries for larger screens

Adjust card size: max-width: 700px, height: 450px
Add border radius: border-radius: 15px
Apply container shadows: box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
Reduce font sizes on desktop

Primary text: font-size: 36px
Secondary text: font-size: 32px
Tertiary text: font-size: 18px
9. Accessibility Considerations
Ensure proper color contrast

Maintain 4.5:1 contrast ratio for text readability
Add clear visual indicators for interactive elements
Support keyboard navigation

Implement arrow key navigation between cards
Use spacebar for card flipping
Add clear focus indicators
10. Performance Optimization
Use hardware-accelerated properties

Favor transform and opacity for animations
Apply will-change: transform for elements that will animate
Use translateZ(0) or translate3d(0,0,0) to force GPU rendering
Implement optimized rendering

Use contain: content where appropriate
Consider using content-visibility: auto for off-screen cards
Ensure smooth 60fps animations
By following these detailed technical requirements, you will create a modern, full-screen mobile flashcard experience with centered content, proper controls positioning, and no overflow issues.