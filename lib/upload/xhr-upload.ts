export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
  etaSeconds: number;
}

export interface XhrUploadOptions<T> {
  method?: 'POST' | 'PATCH' | 'PUT';
  endpoint: string;
  file: File;
  fieldName: string;
  onProgress?: (progress: UploadProgress) => void;
  extraFields?: Record<string, string>;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 1) return 'a moment';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Upload a file using XMLHttpRequest so we can track progress and estimate
 * time remaining. Returns the parsed JSON response.
 */
export function xhrUpload<T>(options: XhrUploadOptions<T>): Promise<T> {
  const { method = 'POST', endpoint, file, fieldName, onProgress, extraFields } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append(fieldName, file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const startTime = Date.now();

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (!event.lengthComputable || !onProgress) return;
      const loaded = event.loaded;
      const total = event.total;
      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const bytesPerSecond = elapsedSeconds > 0 && loaded > 0 ? loaded / elapsedSeconds : 0;
      const remainingBytes = total - loaded;
      const etaSeconds = bytesPerSecond > 0 ? remainingBytes / bytesPerSecond : 0;
      onProgress({ percent, loaded, total, etaSeconds });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(xhr.responseText ? (JSON.parse(xhr.responseText) as T) : (undefined as T));
        } catch {
          resolve(xhr.responseText as unknown as T);
        }
      } else {
        let message = 'Upload failed';
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.error) message = data.error;
        } catch {}
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.open(method, endpoint);
    xhr.send(formData);
  });
}
