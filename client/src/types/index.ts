export type UserRole = 'citizen' | 'admin' | 'worker';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ComplaintStatus =
  | 'Submitted'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Reopened'
  | 'Rejected'
  | 'Withdrawn';

export type WasteCategory =
  | 'Garbage Accumulation'
  | 'Overflowing Dustbin'
  | 'Missed Waste Collection'
  | 'Illegal Dumping'
  | 'Construction Waste'
  | 'Plastic Waste'
  | 'Organic Waste'
  | 'Electronic Waste'
  | 'Other';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  active: number;
  created_at: string;
}

export interface ComplaintImage {
  id: number;
  complaint_id: number;
  image_url: string;
  image_type: 'before' | 'after' | 'additional';
  uploaded_by_id: number;
  created_at: string;
}

export interface ComplaintStatusHistory {
  id: number;
  complaint_id: number;
  previous_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  changed_by_id: number;
  changed_by_name?: string;
  changed_by_role?: UserRole;
  note?: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  public_complaint_id: string;
  citizen_id: number;
  citizen_name?: string;
  citizen_email?: string;
  title: string;
  description: string;
  category: WasteCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  address: string;
  locality: string;
  latitude: number | null;
  longitude: number | null;
  assigned_worker_id: number | null;
  assigned_worker_name?: string;
  resolution_note?: string | null;
  duplicate_of_id: number | null;
  duplicate_of_public_id?: string | null;
  is_duplicate: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  deleted_at: string | null;
  images?: ComplaintImage[];
  status_history?: ComplaintStatusHistory[];
  before_image_url?: string;
  after_image_url?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  related_complaint_id?: number | null;
  related_public_id?: string | null;
  is_read: number;
  created_at: string;
}

export interface DuplicatePair {
  id: number;
  primary_complaint_id: number;
  duplicate_complaint_id: number;
  similarity_score: number;
  match_reasons: string[];
  status: 'suspected' | 'confirmed' | 'rejected';
  created_at: string;
  primary_public_id: string;
  primary_title: string;
  primary_category: string;
  primary_status: string;
  primary_created_at: string;
  duplicate_public_id: string;
  duplicate_title: string;
  duplicate_category: string;
  duplicate_status: string;
  duplicate_created_at: string;
}

export interface WorkerWorkload {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  activeTasks: number;
  completedTasks: number;
  avgResolutionHours: number;
}

export interface DashboardMetrics {
  totalComplaints: number;
  totalValidComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  overdueComplaints: number;
  resolutionRate: number;
  avgResolutionTimeHours: number;
  medianResolutionTimeHours: number;
}
