# Student Project Hub - Implementation Guide

## Project Overview

A modern, real-time SaaS marketplace built with Next.js 16, Node.js API routes, MongoDB, AWS S3, and Razorpay for payment processing. Students can buy and sell projects, assignments, and coursework with secure file storage and transaction handling.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (React 19) with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: MongoDB with proper indexing and relationships
- **File Storage**: AWS S3 with signed URLs and expiration
- **Payments**: Razorpay integration with verification
- **Real-Time**: Socket.io (ready for notifications)
- **Authentication**: Custom JWT-based auth with secure HTTP-only cookies
- **Data Fetching**: SWR for client-side caching

## Project Structure

```
/app
  /api
    /auth
      /register     - User registration
      /login        - User authentication
    /projects       - CRUD operations for projects
      /[id]         - Get, update, delete single project
    /orders         - Order creation and management
      /verify       - Payment verification
      /[orderId]
        /download   - Secure file download with limits
    /upload         - File upload to S3
    /dashboard
      /seller       - Seller statistics and analytics

  /dashboard
    /seller         - Seller control panel
      /upload       - Project upload form

  /marketplace      - Project browsing and search
  /project/[id]     - Project details page
  /login            - User login
  /register         - User registration
  /page.tsx         - Homepage

/lib
  /db.ts           - MongoDB connection
  /models.ts       - TypeScript interfaces
  /auth.ts         - Password hashing, JWT
  /s3.ts           - AWS S3 operations
  /api-response.ts - Response utilities
```

## Database Schema

### Users Collection
```json
{
  "_id": ObjectId,
  "email": "string (unique)",
  "username": "string (unique)",
  "password": "hashed",
  "fullName": "string",
  "role": "buyer|seller|both",
  "avatar": "string",
  "bio": "string",
  "createdAt": Date,
  "updatedAt": Date
}
```

### Projects Collection
```json
{
  "_id": ObjectId,
  "title": "string",
  "description": "string",
  "category": "string (indexed)",
  "sellerId": ObjectId,
  "sellerUsername": "string",
  "price": number,
  "fileUrl": "string",
  "fileKey": "string (S3 key)",
  "fileName": "string",
  "fileSize": number,
  "thumbnail": "string",
  "downloads": number,
  "rating": number,
  "reviews": number,
  "metadata": {
    "tags": ["string"],
    "language": "string",
    "framework": "string",
    "techStack": ["string"]
  },
  "createdAt": Date,
  "updatedAt": Date
}
```

### Orders Collection
```json
{
  "_id": ObjectId,
  "buyerId": ObjectId,
  "buyerUsername": "string",
  "sellerId": ObjectId,
  "sellerUsername": "string",
  "projectId": ObjectId,
  "projectTitle": "string",
  "price": number,
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "status": "pending|completed|failed",
  "downloadCount": number,
  "maxDownloads": 5,
  "expiresAt": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

### Notifications Collection
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "type": "purchase|sale|review|message|system",
  "title": "string",
  "message": "string",
  "relatedId": ObjectId,
  "relatedType": "string",
  "read": boolean,
  "createdAt": Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - List all projects (with filters, search, pagination)
- `POST /api/projects` - Create new project (seller only)
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project (owner only)
- `DELETE /api/projects/[id]` - Delete project (owner only)

### Orders & Payments
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create order (initiate payment)
- `POST /api/orders/verify` - Verify Razorpay payment
- `GET /api/orders/[orderId]/download` - Get signed download URL

### File Upload
- `POST /api/upload` - Upload file to S3 (multipart)

### Dashboard
- `GET /api/dashboard/seller` - Seller statistics and analytics

## Environment Variables

Create a `.env.local` file:

```
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student-hub

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1

# NextAuth
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl-rand-hex-32
NEXTAUTH_URL=http://localhost:3000 (or https://your-domain.com in production)

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET_KEY=your_razorpay_secret

# Socket.io (for future real-time features)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Authentication Flow

1. User registers with email, username, password, and role
2. Password is hashed with bcryptjs (10 rounds)
3. JWT token is generated on login
4. Token stored in HTTP-only cookie and localStorage (for API calls)
5. All protected routes verify token in Authorization header
6. Token includes userId, email, username, and role

## Payment Flow

1. User clicks "Buy Now" on project
2. POST to `/api/orders` creates order and Razorpay order ID
3. Razorpay checkout form displayed to user
4. After payment, Razorpay sends signature verification
5. POST to `/api/orders/verify` verifies signature and marks order as completed
6. Seller receives notification of sale
7. Buyer can download file up to 5 times within 30 days

## File Upload & Download

### Upload
1. File selected on upload form
2. Validated for type and size (100MB max)
3. Multipart form sent to `/api/upload`
4. File uploaded to AWS S3 with timestamped key
5. S3 URL and key returned for project creation

### Download
1. User clicks download after purchase
2. GET `/api/orders/[orderId]/download` with auth token
3. Validates order ownership, status, expiration, and download limit
4. Generates signed S3 URL (1 hour expiration)
5. Returns URL to client
6. Download count incremented

## Security Features

- Password hashing with bcryptjs (10 rounds)
- JWT token-based authentication
- HTTP-only secure cookies for token storage
- Input validation with Zod schemas
- Parameterized database queries (MongoDB prevents injection)
- Signed S3 URLs with time-limited expiration
- Razorpay signature verification
- CORS headers configured
- Rate limiting ready to implement
- Authorization checks on all protected routes

## Pages Implemented

### Public Pages
- `/` - Homepage with featured projects
- `/marketplace` - Browse all projects with filters and search
- `/project/[id]` - Project details page
- `/login` - User login
- `/register` - User registration

### Protected Pages (Buyer)
- `/marketplace` - Project browsing
- `/project/[id]` - Purchase projects
- `/orders/[id]` - Order details and download

### Protected Pages (Seller)
- `/dashboard/seller` - Dashboard with stats, sales, top projects
- `/dashboard/seller/upload` - Upload new project

## Features Implemented

### Phase 1: Setup ✓
- Environment configuration
- MongoDB connection with indexes
- TypeScript models
- Utility functions (auth, S3, API responses)

### Phase 2: Authentication ✓
- User registration with validation
- User login with JWT
- Password hashing and verification
- Role-based access control

### Phase 3: Marketplace ✓
- Project CRUD operations
- Search and filtering
- Pagination
- Project details page
- Featured projects on homepage

### Phase 4: File Upload & S3 ✓
- File upload to S3
- Signed URLs for downloads
- Download URL expiration
- Download limit management

### Phase 5: Payments (Integration Ready)
- Razorpay order creation
- Payment verification with signature checking
- Order status management
- Notification creation for sales

### Phase 6: Real-Time (Ready for Enhancement)
- Socket.io imported and ready
- Notification system foundation
- Ready for live notifications, chat, real-time updates

### Phase 7: Dashboards ✓
- Seller dashboard with statistics
- Recent sales listing
- Top projects display
- Analytics ready for enhancement

### Phase 8: UI/UX ✓
- Modern responsive design
- Tailwind CSS styling
- shadcn/ui components
- Mobile-friendly layout

## Next Steps to Complete

1. **Real-Time Features**
   - Implement Socket.io server
   - Live notification updates
   - Real-time seller statistics

2. **Enhanced Features**
   - User reviews and ratings
   - Wishlist functionality
   - Advanced search with Elasticsearch
   - Categories management

3. **Seller Tools**
   - Project analytics
   - Download history
   - Customer messages

4. **Admin Features**
   - User management
   - Project moderation
   - Dispute resolution

5. **Deployment**
   - Deploy to Vercel
   - Configure MongoDB Atlas
   - Setup AWS S3 bucket
   - Setup Razorpay account
   - Environment variables in Vercel dashboard

## Deployment Instructions

1. **MongoDB Atlas**
   - Create cluster at mongodb.com
   - Get connection string
   - Add to MONGODB_URI

2. **AWS S3**
   - Create bucket
   - Create IAM user with S3 permissions
   - Get access key and secret

3. **Razorpay**
   - Create account at razorpay.com
   - Get API keys
   - Add to environment

4. **Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```
   - Add environment variables in Vercel dashboard
   - Deploy with GitHub integration for CI/CD

## Testing

### Manual Testing Checklist
- [ ] User registration with validation
- [ ] User login and logout
- [ ] Browse marketplace
- [ ] Search and filter projects
- [ ] View project details
- [ ] Upload project (seller)
- [ ] View seller dashboard
- [ ] Create order and verify Razorpay integration
- [ ] Download files within limits

### API Testing
Use Postman or similar to test:
- Register endpoint
- Login endpoint
- Project CRUD endpoints
- Order creation
- Payment verification

## Performance Optimization

- Database indexes on frequently queried fields
- Paginated API responses (default 10-20 items)
- S3 signed URLs with CDN
- Image optimization ready (implement with next/image)
- Lazy loading for projects grid
- SWR for client-side caching

## Monitoring & Analytics

Ready to integrate:
- Vercel Analytics
- MongoDB monitoring
- AWS CloudWatch for S3
- Error tracking (Sentry)
- User analytics

## Support & Documentation

For more information:
- Next.js: https://nextjs.org
- MongoDB: https://mongodb.com
- AWS S3: https://aws.amazon.com/s3/
- Razorpay: https://razorpay.com/docs/
- Tailwind CSS: https://tailwindcss.com
