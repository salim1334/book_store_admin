'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Music, Upload, Trash2, Loader2, Play, Pause } from 'lucide-react';
import {
  uploadLimits,
  MAX_AUDIO_SIZE_BYTES,
  isSupportedAudioType,
} from '@/lib/config/upload-limits';
import {
  xhrUpload,
  formatBytes,
  formatEta,
  type UploadProgress,
} from '@/lib/upload/xhr-upload';

interface AudioUploaderProps {
  chapterId: string;
  audioPath?: string | null;
  onUpdate: (data: { audioPath: string | null }) => void;
}

const audioTypeLabels: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/mp4': 'MP4/M4A',
  'audio/wav': 'WAV',
  'audio/x-m4a': 'M4A',
  'audio/aac': 'AAC',
};

export function AudioUploader({
  chapterId,
  audioPath,
  onUpdate,
}: AudioUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(
    audioPath || null,
  );
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<{
    message: string;
    guideHref: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const supportedAudioLabels = uploadLimits.supportedAudioTypes
    .map((t) => audioTypeLabels[t] || t)
    .join(', ');
  const maxAudioLabel = `${uploadLimits.audioMaxSizeMb}MB`;
  const acceptAudioTypes = uploadLimits.supportedAudioTypes.join(',');

  const clearUploadFeedback = () => {
    setUploadProgress(null);
    setUploadError(null);
  };

  // Sync local state when parent updates the audioPath prop
  useEffect(() => {
    setCurrentAudioPath(audioPath || null);
  }, [audioPath]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearUploadFeedback();

    if (!isSupportedAudioType(file.type)) {
      const message = `Invalid file type (${file.type}). Supported: ${supportedAudioLabels}`;
      setUploadError({
        message,
        guideHref: '/dashboard/guide#preparing-audio',
      });
      toast.error(message);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      const message = `File too large (${formatBytes(file.size)}). Max: ${maxAudioLabel}`;
      setUploadError({
        message,
        guideHref: '/dashboard/guide#preparing-audio',
      });
      toast.error(message);
      e.target.value = '';
      return;
    }

    setLoading(true);
    setUploadProgress({
      percent: 0,
      loaded: 0,
      total: file.size,
      etaSeconds: 0,
    });

    try {
      const data = await xhrUpload<{ audioPath: string }>({
        method: 'POST',
        endpoint: `/api/chapters/${chapterId}/audio`,
        file,
        fieldName: 'audio',
        onProgress: setUploadProgress,
      });

      setCurrentAudioPath(data.audioPath);
      onUpdate({ audioPath: data.audioPath });
      toast.success('Audio uploaded successfully.');
      clearUploadFeedback();
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      const message = error?.message || 'Failed to upload audio';
      setUploadError({
        message,
        guideHref: '/dashboard/guide#preparing-audio',
      });
      toast.error(message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDelete = () => {
    toast('Are you sure you want to delete this audio?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          setLoading(true);
          try {
            const response = await fetch(`/api/chapters/${chapterId}/audio`, {
              method: 'DELETE',
            });

            if (response.ok) {
              setCurrentAudioPath(null);
              onUpdate({ audioPath: null });
              toast.success('Audio deleted successfully.');
            } else {
              const error = await response.json();
              toast.error(error.error || 'Failed to delete audio');
            }
          } catch (error) {
            console.error('Error deleting audio:', error);
            toast.error('An error occurred');
          } finally {
            setLoading(false);
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      classNames: {
        actionButton: 'bg-red-600 text-white',
      },
    });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setPlaying(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 shrink-0" />
              Audio Narration
            </CardTitle>
            <CardDescription>
              Add optional audio narration. Supported formats:{' '}
              {supportedAudioLabels} (max {maxAudioLabel}).
            </CardDescription>
          </div>
          {!currentAudioPath && (
            <label htmlFor="audio-upload" className="shrink-0">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => document.getElementById('audio-upload')?.click()}
                type="button"
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Audio
                  </>
                )}
              </Button>
              <input
                id="audio-upload"
                type="file"
                accept={acceptAudioTypes}
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {uploadError.message}
            </p>
            <p className="mt-1 text-sm text-red-700">
              Try compressing or re-exporting the file, then{' '}
              <Link href={uploadError.guideHref} className="underline">
                check the Content Guide
              </Link>{' '}
              for recommended tools and tips.
            </p>
          </div>
        )}

        {uploadProgress && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Uploading audio...</span>
              <span className="text-gray-500">{uploadProgress.percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {formatBytes(uploadProgress.loaded)} /{' '}
                {formatBytes(uploadProgress.total)}
              </span>
              <span>~{formatEta(uploadProgress.etaSeconds)} left</span>
            </div>
          </div>
        )}

        {!currentAudioPath ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Music className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No audio narration yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Supported formats: {supportedAudioLabels} (max {maxAudioLabel})
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
              <div className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Audio Narration</p>
                <p className="text-xs text-gray-500 truncate">
                  {currentAudioPath}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label htmlFor="audio-replace">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() =>
                      document.getElementById('audio-replace')?.click()
                    }
                    type="button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Replacing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Replace
                      </>
                    )}
                  </Button>
                  <input
                    id="audio-replace"
                    type="file"
                    accept={acceptAudioTypes}
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-red-600"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={currentAudioPath}
              onEnded={handleAudioEnded}
              className="w-full"
              controls
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
