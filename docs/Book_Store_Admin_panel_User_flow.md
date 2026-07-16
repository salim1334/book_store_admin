1. Authentication & Onboarding
   • Access: Users visit the site. If they are not authenticated or their session has
   expired, they land on the Login page.
   • Login Methods: Users log in using Email/Password. 
   • Edge Cases & Recovery:
   o There is currently no self-serve "Forgot Password" flow. Password resets for
   authors are handled by the SuperAdmin via the Authors list.
   • Author Onboarding: SuperAdmins create Author accounts from the Authors page. A
   new author receives the credentials needed to log in (for example, the SuperAdmin can
   set or reset a temporary password). Automated email invites are not implemented yet.
   • Role Routing: Upon successful login, the system routes the user based on their
   role: `AUTHOR` or `SUPER_ADMIN`.
2. Author Dashboard & Book Management
   • Dashboard View: Authors see a centralized list of all their books. SuperAdmins
   see the same plus an "All Books" view.
   • State Indicators: Every book displays a clear visual badge denoting its status:
   `DRAFT`, `PUBLISHED`, or `UNPUBLISHED_CHANGES`.
   • Visibility: The Book model also supports `isHidden` (separate from the lifecycle
   status). Hidden books are not exposed to the mobile reader app.
   • Bundling: A book can be marked `isBundled` so the mobile app can ship it as the
   offline-first bundled book.
   • Book Actions: Authors can create new books, edit existing ones, delete them (soft
   delete using `deletedAt`), publish them, and hide/unhide them.
3. Content Creation & Hierarchy (Book → Chapter → Content)
   • Drafting: The Author creates a Book, adds Chapters under it, and adds Content
   under those chapters (Text-based, Image-based, and optional Audio).
   • Reordering:
   o Chapters are reordered with drag-and-drop inside the Book Editor (dnd-kit).
   o Chapter pages are reordered with Move Up / Move Down buttons.
   • Media Guidance & Context: The Content Guide page provides text guidance on:
   o Maximum file size limits.
   o Recommended file formats.
   o Image/audio preparation best practices.
   o Audio synchronization for pages.
   These limits are configured via environment variables (see `lib/config/upload-limits.ts`).
   • Upload Experience: The upload UI includes visible progress bars, ETA, and error
   messages. Auto-resume after a dropped connection is not implemented yet.
   • Save Feedback: Authors must click "Save" explicitly. Continuous autosave is not
   implemented yet.
4. Review & Publishing
   • Pre-Publish Validation: The Book Editor shows a pre-publish checklist (title, at
   least one chapter, cover image) and disables Publish until the basics are present.
   • Chapter Validation: When a chapter is saved, the editor validates that the title is
   not empty, the chapter contains at least one page, and (for TEXT books) every page has
   content.
   • Preview: Authors can open a book preview route (a separate read-only page). A true
   inline "Live Preview" of the exact reader renderer is not implemented yet.
   • Editing Live Books: When an Author edits a published book, the backend automatically
   sets the status to `UNPUBLISHED_CHANGES`. The Author clicks "Republish" to push the
   updated version live.
5. SuperAdmin Capabilities
   • Account Management: SuperAdmins can create Author accounts, reset their
   passwords, suspend/activate them (`isActive`), and delete them.
   • Global Content Management: SuperAdmins can view and manage every book on the
   platform via the "All Books" page.
   • Moderation Override: SuperAdmins can publish/unpublish books and delete content.
   A dedicated one-click "Unpublish" button exists inside the Book Editor.
   • Impersonation: The "Log in as [Author]" feature is not implemented yet.
