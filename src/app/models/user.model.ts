export type UserRole = 'admin' | 'employer' | 'applicant';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  company?: string;
  savedJobs?: string[];
  createdAt: Date;
}
