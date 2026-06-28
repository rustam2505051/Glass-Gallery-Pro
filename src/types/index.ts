// RestArtuz Enterprise Type Definitions

// Multi-language text support
export interface MultiLangText {
  uz: string;
  ru: string;
  en: string;
}

// Language type
export type Language = 'uz' | 'ru' | 'en';

// Stock status
export type StockStatus = 'in_stock' | 'out_of_stock' | 'pre_order' | 'discontinued';

// Category Model
export interface Category {
  id: string;
  name: MultiLangText;
  description?: MultiLangText;
  icon?: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  productCount?: number;
  createdAt: Date | any;
  updatedAt: Date | any;
}

// Product Model - Enterprise Grade
export interface Product {
  id: string;
  code: string; // Unique product code
  name: MultiLangText;
  categoryId: string;
  categoryName?: MultiLangText; // Denormalized for faster queries
  description: MultiLangText;
  
  // Images
  images: ProductImage[];
  thumbnailUrl: string; // First image or optimized thumbnail
  
  // Specifications
  material?: MultiLangText;
  size?: string; // e.g., "120x60 cm"
  thickness?: string; // e.g., "8mm"
  colors: string[]; // Available colors
  
  // Metadata
  tags: string[]; // For search and filtering
  price?: number; // Optional price
  currency?: string; // USD, UZS, etc.
  stockStatus: StockStatus;
  
  // Files
  qrCodeUrl?: string;
  pdfCatalogUrl?: string;
  
  // Relations
  relatedProductIds: string[]; // IDs of related products
  
  // Analytics (for Phase 2)
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  lastViewedAt?: Date | any;
  
  // Admin
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean; // For "New Arrivals"
  
  // Timestamps
  createdAt: Date | any;
  updatedAt: Date | any;
  createdBy?: string; // Admin user ID
}

// Product Image
export interface ProductImage {
  id: string;
  url: string; // Full resolution
  thumbnailUrl: string; // Optimized thumbnail
  order: number;
  caption?: string;
  storagePath: string; // For deletion
}

// App Settings - Editable from Admin
export interface AppSettings {
  id: string;
  
  // Company Information
  companyName: MultiLangText;
  companyDescription?: MultiLangText;
  logoUrl: string;
  
  // Contact Information
  phoneNumbers: string[]; // Multiple phone numbers
  whatsappNumber: string;
  whatsappLink: string; // Full WhatsApp link
  telegramUsername: string;
  telegramLink: string; // Full Telegram link
  email?: string;
  website?: string;
  address?: MultiLangText;
  
  // App Branding
  primaryColor: string; // Hex color
  accentColor: string; // Hex color (gold)
  
  // Home Banners
  banners: Banner[];
  
  // Features
  enablePricing: boolean;
  enableSharing: boolean;
  enableFavorites: boolean;
  
  // Timestamps
  updatedAt: Date | any;
  updatedBy?: string;
}

// Banner
export interface Banner {
  id: string;
  imageUrl: string;
  title?: MultiLangText;
  subtitle?: MultiLangText;
  linkType?: 'category' | 'product' | 'external' | 'none';
  linkId?: string; // Category or Product ID
  linkUrl?: string; // External URL
  order: number;
  isActive: boolean;
}

// User Favorite
export interface Favorite {
  id: string;
  userId?: string; // Optional, for logged-in users
  productId: string;
  createdAt: Date | any;
}

// Recently Viewed
export interface RecentlyViewed {
  id: string;
  userId?: string;
  productId: string;
  viewedAt: Date | any;
}

// Search Query (for analytics)
export interface SearchQuery {
  id: string;
  query: string;
  language: Language;
  resultsCount: number;
  timestamp: Date | any;
}

// Admin User (for Phase 2 - Roles & Permissions)
export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: Date | any;
  createdAt: Date | any;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Filter params for products
export interface ProductFilters {
  categoryId?: string;
  searchQuery?: string;
  stockStatus?: StockStatus;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  tags?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
}
