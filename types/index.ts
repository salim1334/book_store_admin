export type UserRole = 'SUPER_ADMIN' | 'AUTHOR';
export type BookType = 'IMAGE' | 'TEXT';
export type BookStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED_CHANGES';
export type SwipeDirection = 'RTL' | 'LTR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  authorId: string;
  title: string;
  description?: string;
  coverImage?: string;
  type: BookType;
  status: BookStatus;
  swipeDirection: SwipeDirection;
  isHidden: boolean;
  isBundled: boolean;
  version: number;
  publishedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  bookId: string;
  authorId: string;
  title: string;
  orderIndex: number;
  version: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  book?: Book;
  pages?: ChapterPage[];
  texts?: ChapterText[];
  audios?: ChapterAudio[];
}

export interface ChapterPage {
  id: string;
  chapterId: string;
  authorId: string;
  imagePath: string;
  orderIndex: number;
  swipeDirection: SwipeDirection;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterText {
  id: string;
  chapterId: string;
  authorId: string;
  content: string;
  swipeDirection: SwipeDirection;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterAudio {
  id: string;
  chapterId: string;
  authorId: string;
  audioPath: string;
  duration?: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}
