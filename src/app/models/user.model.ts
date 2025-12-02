export type UserRole = 'admin' | 'employer' | 'applicant';

export interface UserProfile {
  uid: string;
  firstName?: string;
  lastName?: string;
  companyName? : string;
  email: string;
  role: UserRole;
  displayName?: string;
  company?: string;
  savedJobs?: string[];
  createdAt: Date;
}
