# Quick Setup Guide

Follow these steps to get your Book Store Admin Panel up and running.

## Prerequisites

- ✅ Node.js 20+ installed
- ✅ MySQL 8.0+ installed and running
- ✅ Git installed

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp env.example .env
```

Then edit `.env` with your actual values:

```env
DATABASE_URL="mysql://root:password@localhost:3306/book_store_admin"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Create MySQL Database

```sql
CREATE DATABASE book_store_admin;
```

Or using command line:
```bash
mysql -u root -p -e "CREATE DATABASE book_store_admin;"
```

### 4. Run Database Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed the Database (Optional but Recommended)

This creates demo accounts for testing:

```bash
npx prisma db seed
```

**Demo Accounts Created:**
- **SuperAdmin**: admin@bookstore.com / admin123
- **Author**: author@bookstore.com / author123

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Verify Installation

1. Navigate to http://localhost:3000
2. You should be redirected to the login page
3. Login with the SuperAdmin credentials:
   - Email: `admin@bookstore.com`
   - Password: `admin123`
4. You should see the dashboard with demo data

## Common Issues

### Database Connection Error

**Problem**: Cannot connect to MySQL database

**Solution**:
- Verify MySQL is running: `mysql --version`
- Check your DATABASE_URL in `.env`
- Ensure the database exists: `SHOW DATABASES;`

### Prisma Client Not Generated

**Problem**: `@prisma/client` module not found

**Solution**:
```bash
npx prisma generate
```

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**:
```bash
# Run on a different port
PORT=3001 npm run dev
```

## Next Steps

1. **Create Your First Book**
   - Login as an author
   - Navigate to "My Books"
   - Click "Create Book"

2. **Manage Authors** (SuperAdmin only)
   - Navigate to "Authors"
   - Click "Create Author"
   - Send invite emails to new authors

3. **Customize Settings**
   - Update your profile
   - Configure email settings
   - Set up Google OAuth (optional)

## Production Deployment

For production deployment:

1. Set up a production MySQL database
2. Update environment variables
3. Build the application:
   ```bash
   npm run build
   npm start
   ```

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the [API Documentation](README.md#-api-documentation)
- Check the database schema in `prisma/schema.prisma`

---

🎉 **You're all set!** Start building your book collection.
