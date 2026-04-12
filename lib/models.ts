export interface User {
  _id?: string;
  email: string;
  username: string;
  password: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'both';
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id?: string;
  title: string;
  description: string;
  category: string;
  sellerId: string;
  sellerUsername: string;
  price: number;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  thumbnail?: string;
  downloads: number;
  rating: number;
  reviews: number;
  metadata: {
    tags: string[];
    language?: string;
    framework?: string;
    techStack?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  _id?: string;
  buyerId: string;
  buyerUsername: string;
  sellerId: string;
  sellerUsername: string;
  projectId: string;
  projectTitle: string;
  price: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'pending' | 'completed' | 'failed';
  downloadCount: number;
  maxDownloads: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id?: string;
  userId: string;
  type: 'purchase' | 'sale' | 'review' | 'message' | 'system';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  createdAt: Date;
}

export interface SellerStats {
  totalSales: number;
  totalEarnings: number;
  totalProjects: number;
  totalDownloads: number;
  averageRating: number;
  recentSales: Array<{
    projectTitle: string;
    amount: number;
    date: Date;
  }>;
}
