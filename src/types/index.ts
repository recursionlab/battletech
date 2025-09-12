/**
 * Global type definitions
 * 
 * Contains shared types, interfaces, and enums used across modules
 */

// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Configuration types
export interface AppConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  database: {
    host: string;
    port: number;
    name: string;
  };
}