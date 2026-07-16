import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getBookStatusBadge(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-800 border-gray-300',
      };
    case 'PUBLISHED':
      return {
        label: 'Published',
        className: 'bg-green-100 text-green-800 border-green-300',
      };
    case 'UNPUBLISHED_CHANGES':
      return {
        label: 'Unpublished Changes',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      };
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-800 border-gray-300',
      };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
