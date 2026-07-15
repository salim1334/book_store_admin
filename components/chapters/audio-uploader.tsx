'use client';

import { useState, useRef, useEffect } from 'react';
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

interface AudioUploaderProps {
  chapterId: string;
  audioPath?: string | null;
  onUpdate: (data: { audioPath: string | null }) => void;
}

export function AudioUploader({
  chapterId,
  audioPath,
  onUpdate,
}: AudioUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(
    audioPath || null
  );
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync local state when parent updates the audioPath prop
  useEffect(() => {
    setCurrentAudioPath(audioPath || null);
  }, [audioPath]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch(`/api/chapters/${chapterId}/audio`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newPath = data.audioPath; // adjust if your API returns a different field
        setCurrentAudioPath(newPath);
        onUpdate({ audioPath: newPath });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload audio');
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('An error occurred');
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Audio Narration
            </CardTitle>
            <CardDescription>
              Add optional audio narration for this chapter (MP3, M4A, or WAV)
            </CardDescription>
          </div>
          {!currentAudioPath && (
            <label htmlFor="audio-upload">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => document.getElementById('audio-upload')?.click()}
                type="button"
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
                accept="audio/mpeg,audio/mp4,audio/wav,audio/x-m4a"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!currentAudioPath ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Music className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No audio narration yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Supported formats: MP3, M4A, WAV (max 50MB)
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
              <div className="flex gap-2">
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
                    accept="audio/mpeg,audio/mp4,audio/wav,audio/x-m4a"
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
