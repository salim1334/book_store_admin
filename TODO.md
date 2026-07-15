# TODO

## Upload limits, validation, UX, guide, and audio timing overlap

### §1 Config extraction

- [ ] Create `lib/config/upload-limits.ts` (env-backed, sensible fallbacks)
- [ ] Update `lib/file-upload.ts` to use shared config and remove local constants

### §2 + §3 Client-side pre-upload validation + progress UX

- [ ] Add XHR upload helper `lib/upload/xhr-upload.ts` (progress + ETA)
- [ ] Update `components/chapters/page-manager.tsx` to:
  - [ ] preflight validate image type/size
  - [ ] show spec rejection UI with compression tools + Open Guide link
  - [ ] upload via XHR with file name/size/progress/ETA
- [ ] Update `components/chapters/audio-uploader.tsx` to:
  - [ ] preflight validate audio type/size
  - [ ] show spec rejection UI with compression tools + Open Guide link
  - [ ] upload via XHR with file name/size/progress/ETA

### §4 Content Creation Guide page

- [ ] Create `lib/guide-content.ts` structured guide sections (tools/videos/faqs)
- [ ] Add `app/(dashboard)/dashboard/guide/page.tsx` rendering from structured data (search, timeline, FAQ, videos)
- [ ] Update `components/layout/sidebar.tsx` to add “Content Guide” link for both roles

### §5 Audio timing overlap validation

- [ ] Server-side: update `app/api/chapters/[chapterId]/route.ts` PUT to validate:
  - [ ] narration start/end completeness
  - [ ] end > start
  - [ ] no overlaps across pages
- [ ] Client-side: update `components/chapters/chapter-editor.tsx` validateChapter (and/or page-manager) to surface inline overlap errors before save
