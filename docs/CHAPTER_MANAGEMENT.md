# Chapter Management System

## Overview

The Chapter Management module has been completely redesigned to support multi-page chapters with the following features:

- **Multiple ordered pages** for both TEXT and IMAGE books
- **Audio narration** support (optional)
- **File upload management** for images and audio
- **Page reordering** via move up/down buttons
- **Comprehensive validation** to ensure data integrity

---

## Content Hierarchy

```
Author
└── Book
    └── Chapter
        ├── Pages (ordered)
        │   ├── Text Content (for TEXT books)
        │   └── Images (for IMAGE books)
        └── Optional Audio
```

---

## Database Schema

### Chapter Model

```prisma
model Chapter {
  id              String        @id @default(cuid())
  bookId          String
  authorId        String
  title           String
  orderIndex      Int
  version         Int           @default(1)
  deletedAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  book            Book          @relation(...)
  pages           ChapterPage[] // For IMAGE books
  texts           ChapterText[] // For TEXT books
  audios          ChapterAudio[]
}
```

### ChapterPage Model (IMAGE Books)

```prisma
model ChapterPage {
  id              String    @id @default(cuid())
  chapterId       String
  authorId        String
  imagePath       String
  orderIndex      Int       // For ordering pages
  audioStartTime  Float?    // Optional audio sync marker (seconds)
  audioEndTime    Float?    // Optional audio sync marker (seconds)
  version         Int       @default(1)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### ChapterText Model (TEXT Books)

```prisma
model ChapterText {
  id              String    @id @default(cuid())
  chapterId       String
  authorId        String
  content         String    @db.LongText
  orderIndex      Int       @default(1)  // For ordering pages
  audioStartTime  Float?    // Optional audio sync marker (seconds)
  audioEndTime    Float?    // Optional audio sync marker (seconds)
  version         Int       @default(1)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### ChapterAudio Model

```prisma
model ChapterAudio {
  id              String    @id @default(cuid())
  chapterId       String
  authorId        String
  audioPath       String
  duration        Int?      // Duration in seconds (optional)
  version         Int       @default(1)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## API Endpoints

### Page Management

#### `GET /api/chapters/[chapterId]/pages`

Returns all pages for a chapter (either ChapterPage or ChapterText based on book type).

**Response:**

```json
{
  "pages": [...],
  "bookType": "TEXT" | "IMAGE"
}
```

#### `POST /api/chapters/[chapterId]/pages`

Add a new page to the chapter.

**For TEXT books:**

```json
{
  "content": "Page content here..."
}
```

**For IMAGE books:**

```
Content-Type: multipart/form-data
image: File (JPEG, PNG, WebP)
```

#### `PATCH /api/chapters/[chapterId]/pages/[pageId]`

Update an existing page.

**For TEXT books:**

```json
{
  "content": "Updated content..."
}
```

**For IMAGE books:**

```
Content-Type: multipart/form-data
image: File (replacement image)
```

#### `DELETE /api/chapters/[chapterId]/pages/[pageId]`

Delete a specific page (also deletes associated image file if IMAGE book).

#### `POST /api/chapters/[chapterId]/pages/reorder`

Reorder pages within a chapter.

**Request:**

```json
{
  "pageIds": ["id1", "id2", "id3", ...]
}
```

The order of IDs in the array determines the new orderIndex values.

#### `PUT /api/chapters/[chapterId]`

Save the entire chapter, including title, pages, and optional audio path. The backend
currently upserts pages/audioStartTime/audioEndTime without validating timing
overlap or completeness.

---

### Audio Management

#### `POST /api/chapters/[chapterId]/audio`

Upload or replace audio narration.

**Request:**

```
Content-Type: multipart/form-data
audio: File (MP3, M4A, WAV)
```

**Note:** Only one audio file per chapter. Uploading a new file replaces the existing one.

#### `DELETE /api/chapters/[chapterId]/audio`

Delete audio narration (also removes the audio file from storage).

---

## File Upload Specifications

### Images

- **Allowed types:** JPEG, PNG, WebP
- **Max size:** 10 MB
- **Storage path:** `/public/uploads/images/{bookId}/{chapterId}/`

### Audio

- **Allowed types:** MP3, M4A, WAV
- **Max size:** 50 MB
- **Storage path:** `/public/uploads/audio/{bookId}/{chapterId}/`

### File Naming

Files are automatically renamed to prevent conflicts:

```
{sanitized_name}_{timestamp}_{random}.{ext}
```

---

## UI Components

### `<ChapterEditor>`

Main chapter editing interface.

**Features:**

- Chapter title editing
- Validation error display
- Integration with PageManager and AudioUploader
- Save and Delete actions

**Validation:**

- Chapter title must not be empty
- At least one page required
- All TEXT pages must have content
- Cannot save if validation fails

### `<PageManager>`

Manages multiple pages for a chapter.

**Props:**

```tsx
interface PageManagerProps {
  bookType: 'TEXT' | 'IMAGE';
  pages: Page[];
  chapterId: string;
  onUpdate: () => void;
}
```

**Features for TEXT books:**

- Add new text pages
- Edit page content inline
- Delete pages
- Reorder pages (move up/down)
- Set optional audio start/end times per page

**Features for IMAGE books:**

- Upload new images
- Replace existing images
- Delete pages
- Reorder pages (move up/down)
- Image preview
- Set optional audio start/end times per page

### `<AudioUploader>`

Manages audio narration for a chapter.

**Props:**

```tsx
interface AudioUploaderProps {
  chapterId: string;
  audioPath?: string;
  onUpdate: () => void;
}
```

**Features:**

- Upload audio file with progress and ETA
- Replace existing audio
- Delete audio
- Play/pause audio preview
- HTML5 audio controls
- Validates file type and size against `uploadLimits`

---

## Workflow

### Creating a New Chapter

1. Navigate to book details page
2. Click "Add Chapter"
3. Enter chapter title
4. Click "Create Chapter"
5. You'll be redirected to the chapter editor
6. Add pages:
   - **TEXT books:** Click "Add Page" and enter content
   - **IMAGE books:** Click "Upload Image" and select files
7. (Optional) Upload audio narration
8. Click "Save Chapter"

### Editing an Existing Chapter

1. Navigate to chapter from book details
2. Edit chapter title if needed
3. Manage pages:
   - Click on text to edit (TEXT books)
   - Use upload/replace/delete buttons (IMAGE books)
   - Use move up/down to reorder
4. Manage audio if needed
5. Click "Save Chapter"

### Deleting a Chapter

1. Navigate to chapter editor
2. Click "Delete" button
3. Confirm deletion
4. All pages and audio will be removed
5. Redirected to book details page

---

## Validation Rules

### Chapter Title

- ✅ Required
- ✅ Must not be empty after trimming whitespace

### Pages

- ✅ At least one page required
- ✅ TEXT pages must have non-empty content
- ✅ IMAGE pages must have a valid image file

### Audio Timing

- ✅ The client-side utility `lib/audio-timing.ts` validates:
  - Every page must have both `audioStartTime` and `audioEndTime` when audio is attached.
  - `audioStartTime` must be >= 0.
  - `audioEndTime` must be strictly greater than `audioStartTime`.
  - Time ranges must not overlap across pages (adjacent ranges are allowed).
  - Timing values must be removed when no audio is attached.
- ⚠️ The API currently accepts these values without its own server-side re-validation
  (use the shared utility to validate before saving if you add API-level checks).

### Files

- ✅ Images: configured `supportedImageTypes` (max `imageMaxSizeMb` MB)
- ✅ Audio: configured `supportedAudioTypes` (max `audioMaxSizeMb` MB)

---

## Data Migration

The `orderIndex` field is now part of the schema with a default value. If you have
existing `ChapterText` records created before the field was added, regenerate the
Prisma client and run migrations as normal:

```bash
npx prisma migrate dev
npx prisma generate
```

If you need a one-off backfill script, create `scripts/migrate-chapter-text-order.ts`
and run it with `npx ts-node`.

---

## Technical Details

### File Storage

- Files are stored in the `public/uploads/` directory
- Organized by type, book ID, and chapter ID
- Files are automatically cleaned up when pages/audio are deleted
- Files are served statically via Next.js public directory

### Version Control

- Book version increments when chapters are modified
- Chapter version increments on updates
- Page/Audio versions increment on updates
- Published books change status to `UNPUBLISHED_CHANGES`

### Authorization

- Only chapter authors can modify their chapters
- Super admins can modify any chapter
- Authorization checked on all API endpoints

### Soft Deletes

- Chapters use soft delete (deletedAt timestamp)
- Pages and audio use hard delete with file cleanup
- Cascade deletes configured in Prisma schema

---

## Troubleshooting

### "Page not found" errors

- Ensure Prisma client is regenerated after schema changes
- Check that migrations have been applied

### File upload fails

- Verify upload directory exists and is writable
- Check file size limits
- Verify file type is allowed

### TypeScript errors about orderIndex

- Run `npx prisma generate` to regenerate Prisma client
- Restart TypeScript server in your IDE

### Images not displaying

- Ensure files are in `public/uploads/` directory
- Check that file paths are stored correctly (starting with `/uploads/`)
- Verify Next.js is serving static files

---

## Future Enhancements

Potential improvements for future versions:

- [ ] Drag-and-drop page reordering (using a library like dnd-kit)
- [ ] Rich text editor for TEXT pages (using Tiptap or similar)
- [ ] Image optimization and resizing on upload
- [ ] Audio duration calculation and display
- [ ] Batch image upload
- [ ] Chapter preview mode
- [ ] Export chapter as PDF/EPUB
- [ ] Chapter templates
- [ ] Collaborative editing
- [ ] Version history and rollback

---

## Support

For issues or questions about the Chapter Management system, please refer to:

- This documentation
- API endpoint documentation
- Component source code with inline comments
