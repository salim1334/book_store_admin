'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
  uploadLimits,
  MAX_AUDIO_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
} from '@/lib/config/upload-limits';
import { guideSections } from '@/lib/guide-content';

function formatMb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(0) + 'MB';
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
      >
        <div className="text-sm font-medium text-gray-900">{question}</div>
        <div className="text-gray-500">{open ? '−' : '+'}</div>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}

function YoutubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="aspect-video w-full">
      <iframe
        className="w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function AudioTimelineDiagram() {
  // Simple sequential timeline diagram matching the doc's idea.
  // This is a visual explanation; real values are provided in the UI.
  const segments = [
    { start: 0, end: 18, label: '0:00–0:18' },
    { start: 18, end: 44, label: '0:18–0:44' },
    { start: 44, end: 72, label: '0:44–1:12' },
  ];

  const total = segments[segments.length - 1].end;

  return (
    <div className="border rounded-lg bg-white p-4 overflow-x-auto">
      <div className="text-sm font-medium text-gray-900 mb-3">
        Example timeline (1 audio file → sequential page ranges)
      </div>
      <div className="relative h-12 m-3 min-w-[300px]">
        {segments.map((s, idx) => {
          const leftPct = (s.start / total) * 100;
          const widthPct = ((s.end - s.start) / total) * 100;
          return (
            <div
              key={idx}
              className="absolute top-2 h-10 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xs text-emerald-900"
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              aria-label={s.label}
              title={s.label}
            >
              {s.label}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Your real ranges come from audioStartTime / audioEndTime per page.
      </div>
    </div>
  );
}

function getToolHref(toolName: string): string | null {
  // Provide clickable destinations for desktop tools.
  // If a tool isn't recognized, we render its name as plain text.
  switch (toolName) {
    case 'Squoosh':
      return 'https://squoosh.app/';
    case 'TinyPNG':
      return 'https://tinypng.com/';
    case 'ImageOptim (macOS)':
      return 'https://imageoptim.com/';
    case 'Caesium (Windows)':
      return 'https://saerasoft.com/';
    case 'XnConvert':
      return 'https://www.xnview.com/xnconvert/';
    case 'RIOT':
      return 'https://riot-optimizer.sourceforge.io/';
    case 'Audacity':
      return 'https://www.audacityteam.org/';
    case 'Ocenaudio':
      return 'https://www.ocenaudio.com/';
    case 'FFmpeg':
      return 'https://ffmpeg.org/';
    case 'Adobe Podcast':
      return 'https://podcast.adobe.com/';
    default:
      return null;
  }
}

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Content Guide</h1>
        <p className="text-gray-600 text-sm">
          This guide is written for people who are not very familiar with
          electronics. Follow the steps below slowly, and you will be able to
          upload images, audio, and timings correctly.
        </p>
      </div>

      <div className="space-y-6">
        {guideSections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 md:scroll-mt-28 space-y-2"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {section.title}
            </h2>
            {section.body && (
              <p className="text-sm text-gray-700">{section.body}</p>
            )}

            {section.id === 'audio-synchronization' && <AudioTimelineDiagram />}

            {section.tools && section.tools.length > 0 && (
              <div className="border rounded-lg bg-white p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Tools
                </div>
                <ul className="space-y-2">
                  {section.tools.map((t) => {
                    const href = getToolHref(t.name);
                    const label = t.beginnerFriendly
                      ? `${t.name} (Beginner-friendly)`
                      : t.name;

                    return (
                      <li key={t.name} className="flex items-start gap-2">
                        <span className="text-sm">•</span>
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-emerald-700 hover:text-emerald-800 underline"
                          >
                            {label}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-700">{label}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {section.id === 'recommended-workflow' && (
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {section.body
                  .split('→')
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
              </ol>
            )}

            {section.id === 'video-tutorials' &&
              section.videos &&
              section.videos.length > 0 && (
                <div className="space-y-4">
                  {section.videos.map((v) => (
                    <div key={v.youtubeId} className="space-y-2">
                      <div className="text-sm font-medium text-gray-900">
                        {v.title}
                      </div>
                      <YoutubeEmbed videoId={v.youtubeId} />
                    </div>
                  ))}
                </div>
              )}

            {section.id === 'best-practices' && !section.body && (
              <ul className="text-sm text-gray-700 space-y-1">
                <li>
                  • Keep image quality high while still compressing for mobile.
                </li>
                <li>• Record clear audio and remove unnecessary silence.</li>
                <li>• Organize pages and chapters consistently.</li>
                <li>• Test synchronization by previewing before publishing.</li>
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
