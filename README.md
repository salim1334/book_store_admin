# Book Store Admin Panel

A comprehensive admin panel for managing author-branded book reader applications. This system allows authors to create, manage, and publish books with chapters, text content, images, and audio.

## 🚀 Features

### Authentication & Authorization

- ✅ Email/Password authentication
- ✅ Google OAuth integration
- ✅ Role-based access control (SuperAdmin & Author)
- ✅ Automated invite system for new authors
- ✅ Forgot password flow
- ✅ Secure session management with NextAuth.js

### Author Dashboard

- ✅ Overview of all books with status indicators
- ✅ Create and manage books (TEXT or IMAGE types)
- ✅ Chapter management with drag-and-drop reordering
- ✅ Content creation (text, images, audio)
- ✅ Live preview mode
- ✅ Autosave functionality
- ✅ Version control for content updates
- ✅ Draft/Published/Unpublished Changes workflow

### SuperAdmin Features

- ✅ Author account management
- ✅ Create and invite new authors
- ✅ Suspend/activate author accounts
- ✅ View all books across all authors
- ✅ Author impersonation for troubleshooting
- ✅ One-click unpublish for moderation

### Content Management

- ✅ Hierarchical structure: Book → Chapter → Content
- ✅ Support for TEXT books (written content)
- ✅ Support for IMAGE books (page-based)
- ✅ Audio attachment for chapters
- ✅ Media upload with progress tracking
- ✅ Soft delete for books and chapters
- ✅ Publishing validation

## 🛠️ Tech Stack

- **Framework**: Next.js ^15.5.20 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
- **UI Components**: Radix UI + Custom components
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod validation

## 📋 Prerequisites

- Node.js 20+
- MySQL 8.0+
- npm or yarn

## 🔧 Installation

1. **Clone the repository**

```bash
cd c:\Users\WINDOWS1\Desktop\Salim_Dev\book_reader\admin_panel
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/book_store_admin"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Configuration (for invite emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# File Upload
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=52428800  # 50MB in bytes
```

4. **Set up the database**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

5. **Create a SuperAdmin account**

You can create a SuperAdmin account directly in the database or use Prisma Studio:

```bash
npx prisma studio
```

Then create a user with:

- Email: admin@example.com
- Password: (hashed with bcrypt)
- Role: SUPER_ADMIN
- isActive: true

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
admin_panel/
├── app/
│   ├── (auth)/
│   │   └── login/              # Login page
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── page.tsx        # Dashboard home
│   │       ├── books/          # Book management
│   │       ├── authors/        # Author management (SuperAdmin)
│   │       └── settings/       # Settings
│   ├── api/
│   │   ├── auth/              # NextAuth API routes
│   │   ├── books/             # Book API endpoints
│   │   ├── chapters/          # Chapter API endpoints
│   │   └── authors/           # Author API endpoints
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Layout components
│   ├── books/                 # Book-specific components
│   └── auth/                  # Auth components
├── lib/
│   ├── db.ts                  # Prisma client
│   ├── auth.ts                # Auth utilities
│   └── utils.ts               # Helper functions
├── prisma/
│   └── schema.prisma          # Database schema
├── types/
│   └── index.ts               # TypeScript types
├── auth.ts                    # NextAuth configuration
├── auth.config.ts             # NextAuth config
└── middleware.ts              # Route protection
```

## 🔐 User Roles

### SuperAdmin

- Create and manage author accounts
- View all books across all authors
- Suspend/delete author accounts
- Impersonate authors for troubleshooting
- One-click unpublish for moderation

### Author

- Create and manage their own books
- Add chapters and content
- Upload images and audio
- Publish/unpublish books
- Preview content before publishing

## 📚 Database Schema

### Key Models

- **User**: Author and SuperAdmin accounts
- **Book**: Book metadata and settings
- **Chapter**: Book chapters with ordering
- **ChapterPage**: Image pages for IMAGE books
- **ChapterText**: Text content for TEXT books
- **ChapterAudio**: Audio files for chapters

## 🎨 UI Components

The admin panel uses a custom component library built on top of Radix UI:

- Button
- Input
- Label
- Card
- Badge
- Dialog
- Dropdown Menu
- Select
- Toast notifications

## 🔄 Workflow

### Creating a Book

1. Author logs in
2. Navigate to "My Books"
3. Click "Create Book"
4. Enter book details (title, description, type)
5. Add chapters
6. Add content to chapters
7. Preview the book
8. Publish when ready

### Publishing Flow

- **Draft**: Initial state, not visible to readers
- **Published**: Live and available to readers
- **Unpublished Changes**: Edited after publishing, changes not yet live

## 🚧 Future Enhancements

- [ ] File upload with drag-and-drop
- [ ] Bulk chapter operations
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] Email notification system
- [ ] Multi-language support
- [ ] Export/import functionality
- [ ] Advanced media compression tools
- [ ] Collaborative editing

## 📝 API Documentation

### Books API

- `GET /api/books` - List all books
- `POST /api/books` - Create a new book
- `GET /api/books/[id]` - Get book details
- `PATCH /api/books/[id]` - Update book
- `DELETE /api/books/[id]` - Soft delete book

### Chapters API

- `POST /api/chapters` - Create a new chapter
- `GET /api/chapters/[id]` - Get chapter details
- `PATCH /api/chapters/[id]` - Update chapter
- `DELETE /api/chapters/[id]` - Soft delete chapter

### Authors API (SuperAdmin only)

- `GET /api/authors` - List all authors
- `POST /api/authors` - Create a new author
- `PATCH /api/authors/[id]` - Update author
- `DELETE /api/authors/[id]` - Delete author

## 🐛 Troubleshooting

### Database Connection Issues

- Verify MySQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Authentication Issues

- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

### Build Errors

- Delete node_modules and package-lock.json
- Run `npm install` again
- Clear Next.js cache: `rm -rf .next`

## 📄 License

This project is proprietary software for the Book Store application.

## 👥 Support

For support and questions, contact the development team.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
