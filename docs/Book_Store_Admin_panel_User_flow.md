1. Authentication & Onboarding
• Access: Users visit the site. If they are not authenticated or their session has
expired, they land on the Login page.
• Login Methods: Users log in using Email/Password or "Continue with Google".
• Edge Cases & Recovery:
o Includes a self-serve "Forgot Password" flow.
o If a user tries Google SSO before an account is provisioned for them, they
see a clear error: "Account not found. Please contact your administrator."
• Author Onboarding: Rather than handing out manual passwords, the system sends
an automated invite email to new Authors (triggered by the SuperAdmin) with a
secure link to set their initial password.
• Role Routing: Upon successful login, the system routes the user based on their
role: Author or SuperAdmin.
2. Author Dashboard & Book Management
• Dashboard View: Authors see a centralized list of all their books.
• State Indicators: Every book displays a clear visual badge denoting its status
(Draft, Published, or Unpublished Changes).
• Book Actions: Authors can create new books, edit existing ones, or archive/delete
them (utilizing a "soft delete" so mistakes can be restored).
3. Content Creation & Hierarchy (Book → Chapter →
Content)
• Drafting: The Author creates a Book, adds Chapters under it, and adds Content
under those chapters (Text-based, Image-based, and Audio).
• Reordering: A drag-and-drop interface allows Authors to easily reorder chapters
and content blocks without manually typing sequence numbers.
• Media Guidance & Context: Before the upload zone, the UI provides
comprehensive guidance:
o Maximum file size limits.
o Text guides on how to compress media.
o Recommended compression tools (with direct links).
o Embedded YouTube tutorials for visual learners.
o The "Why": Explicitly explaining that compression is vital for readers with
poor internet connections.
• Upload Experience: The upload UI includes visible progress bars, error messages,
and auto-resume capabilities if the Author's internet drops during a large audio
upload.
• Autosave Feedback: The system continuously saves all progress as a draft,
displaying a subtle visual confirmation (e.g., "Saving..." → "Saved just now") so the
Author knows their work is secure.
4. Review & Publishing
• Live Preview: Authors can toggle a "Preview" mode to see exactly how the content,
images, and audio will render for the end-user.
• Pre-Publish Validation: When the Author clicks "Publish," the system runs a quick
check and flags empty chapters or missing media before pushing the book live.
• Editing Live Books: If an Author edits a previously published book, the system
creates a background draft. The live version remains unchanged until the Author
clicks "Republish."
5. SuperAdmin Capabilities
• Account Management: SuperAdmins are responsible for creating Author accounts,
sending invites, and suspending or deleting accounts.
• Global Content Management: SuperAdmins can view and manage every book on
the platform.
• Moderation Override: SuperAdmins have a one-click "Unpublish" button to quickly
pull down any broken or inappropriate content.
• Troubleshooting (Impersonation): SuperAdmins can click "Log in as [Author]" to
see the exact dashboard and errors that an Author is experiencing to help them
resolve issues.