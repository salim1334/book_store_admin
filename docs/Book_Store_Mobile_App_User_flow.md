• I. Structured Mobile App User Flow
• 1. Onboarding & Discovery
• Launch: Install and open the app. View the branded splash screen, which includes
the app icon and a short description of the author.
• Home Screen (Returning User): Instantly see a "Continue reading" widget at the
top of the Home screen, resuming from the exact last position.
• Home Screen (Discovery): Browse the books list.
o Identify the 1 bundled book available entirely offline immediately.
o View other available remote books (fetching names and cover images when
online), marked with a specific download icon indicating they can be saved
locally.
• Author Profile: Navigate to view the "About Author" page.
• 2. Navigation & Reading Experience
• Book Details: Open a book's detail page to find its chapter list.
• Reading: Open a chapter.
o IMAGE Book: Swipe horizontally through page images.
o TEXT Book: Scroll vertically through text content.
• Progression & Tracking: Move seamlessly to the next or previous chapter. The app
continuously tracks and saves the reading position.
• Bookmarks & Favorites: Bookmark specific pages or chapters and open the saved
bookmarks list. Add entire books to a Favorites list and access them later. Return
easily to the last opened book.
• 3. Audio Player Integration
• Playback: Start audio playback for a chapter (if available). Pause, resume, and seek
forward or backward.
• Preferences: Change the audio playback speed and save this preference in
permanent storage so it persists across sessions.
• 4. Download & Offline Management
• Decoupled Downloads: Download audio files separately from the visual chapter
content (images/text) to save space.
• Granular Saving: Download chapters one by one into permanent storage;
downloading an entire book (or the full bundled assets of a chapter if you only want
text) is not required.
• Bulk Saving: Choose to download all remaining chapters or the full book into
permanent storage.
• Resiliency & Tracking: View live download progress and easily retry any failed
downloads.
• Storage Management: Check overall app storage usage to manage local SQLite
and media file footprints.
• 5. Updates & Settings
• Smart Syncing:
o Receive update notifications for changed chapters when online.
o Automatically download TEXT content updates in the background without
prompting.
o Receive prompts to download updated image or audio content, saving the
new assets to permanent storage upon approval.
• Preferences: Toggle dark mode on or off. Open general app settings.