export type GuideTool = {
  name: string;
  beginnerFriendly?: boolean;
};

export type GuideVideo = {
  title: string;
  youtubeId: string;
};

export type GuideFaq = {
  question: string;
  answer: string;
};

export type GuideSection = {
  id: string;
  title: string;
  body: string;
  tools?: GuideTool[];
  videos?: GuideVideo[];
  faqs?: GuideFaq[];
  beginnerFriendly?: boolean;
};

export const guideSections: GuideSection[] = [
  {
    id: 'preparing-images',
    title: 'Preparing Images',
    body:
      'Use the right resolution and aspect ratio so page images look sharp on mobile. Compression helps reduce load time and improves reading performance without sacrificing too much quality.',
    tools: [
      { name: 'Squoosh', beginnerFriendly: true },
      { name: 'TinyPNG', beginnerFriendly: true },
      { name: 'ImageOptim (macOS)', beginnerFriendly: true },
      { name: 'Caesium (Windows)', beginnerFriendly: true },
      { name: 'XnConvert' },
      { name: 'RIOT' },
    ],
  },
  {
    id: 'preparing-audio',
    title: 'Preparing Audio',
    body:
      'For narration, prioritize clarity over file size. Use a consistent bitrate and keep audio clean by removing long silence and reducing background noise before uploading.',
    tools: [
      { name: 'Audacity', beginnerFriendly: true },
      { name: 'Ocenaudio', beginnerFriendly: true },
      { name: 'FFmpeg' },
      { name: 'Adobe Podcast' },
    ],
  },
  {
    id: 'audio-synchronization',
    title: 'How Audio Synchronization Works',
    body:
      'Each chapter uses a single audio file. Audio is mapped to individual pages using audioStartTime and audioEndTime for every page. When the reader reaches a page, the app plays only the corresponding segment.',
  },
  {
    id: 'recommended-workflow',
    title: 'Recommended Workflow',
    body:
      'Write → pages → record → edit → compress → upload narration → upload pages → set timings → preview → publish',
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    body:
      'Keep naming consistent, organize pages in order, and test on mobile before publishing. Quality matters, but compression helps performance and reliability.',
  },
  {
    id: 'faq',
    title: 'FAQ',
    body: '',
    faqs: [
      {
        question: 'Why can\'t I upload my file?',
        answer:
          'Your file may be too large or in an unsupported format. Check the current upload limits and supported MIME types from the system configuration and try compressing/re-exporting your media.',
      },
      {
        question: 'Why is my image blurry?',
        answer:
          'This usually happens when an image is over-compressed or exported at a low resolution. Try a higher-quality export and confirm the aspect ratio matches the reader.',
      },
      {
        question: "Why doesn\'t my audio sync?",
        answer:
          'Audio sync relies on valid audioStartTime and audioEndTime values per page. Ensure each page has both a start and end time, and that time ranges do not overlap.',
      },
      {
        question: 'How should I split long chapters?',
        answer:
          'Split by logical sections (e.g., paragraphs or scenes). Set start/end times so each page maps to a sequential range without overlaps.',
      },
    ],
  },
  {
    id: 'video-tutorials',
    title: 'Video Tutorials',
    body: '',
    videos: [
      { title: 'Compressing images for mobile', youtubeId: 'dQw4w9WgXcQ' },
    ],
  },
];

