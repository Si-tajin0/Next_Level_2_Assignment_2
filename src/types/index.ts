// src/types/index.ts

// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "contributor" | "maintainer";
  created_at: string;
  updated_at: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: "contributor" | "maintainer";
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Issue Types
export interface Issue {
  id: number;
  title: string;
  description: string;
  type: "bug" | "feature_request";
  status: "open" | "in_progress" | "resolved";
  reporter_id: number;
  reporter?: {
    id: number;
    name: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}

export interface IssueWithReporter extends Omit<Issue, "reporter_id"> {
  reporter: {
    id: number;
    name: string;
    role: string;
  };
}

export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}
export interface CreateIssueRequest {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
