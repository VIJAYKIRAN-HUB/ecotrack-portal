PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('citizen', 'admin', 'worker')),
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_complaint_id TEXT NOT NULL UNIQUE,
  citizen_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN (
    'Garbage Accumulation',
    'Overflowing Dustbin',
    'Missed Waste Collection',
    'Illegal Dumping',
    'Construction Waste',
    'Plastic Waste',
    'Organic Waste',
    'Electronic Waste',
    'Other'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK(status IN (
    'Submitted',
    'Verified',
    'Assigned',
    'In Progress',
    'Resolved',
    'Reopened',
    'Rejected',
    'Withdrawn'
  )),
  address TEXT NOT NULL,
  locality TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  assigned_worker_id INTEGER,
  resolution_note TEXT,
  duplicate_of_id INTEGER,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_worker_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (duplicate_of_id) REFERENCES complaints(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_complaints_public_id ON complaints(public_complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_worker ON complaints(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_locality ON complaints(locality);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_deleted ON complaints(deleted_at);

-- Images associated with complaints (before/after/additional)
CREATE TABLE IF NOT EXISTS complaint_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK(image_type IN ('before', 'after', 'additional')),
  uploaded_by_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_images_complaint ON complaint_images(complaint_id);

-- Complaint status change history & audit trail
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by_id INTEGER NOT NULL,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON complaint_status_history(complaint_id);

-- Worker assignments log
CREATE TABLE IF NOT EXISTS worker_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  assigned_by_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'completed', 'reassigned')),
  notes TEXT,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assignments_worker ON worker_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_complaint ON worker_assignments(complaint_id);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_complaint_id INTEGER,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Duplicate relationship tracker
CREATE TABLE IF NOT EXISTS duplicate_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  primary_complaint_id INTEGER NOT NULL,
  duplicate_complaint_id INTEGER NOT NULL,
  similarity_score REAL NOT NULL,
  match_reasons TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'suspected' CHECK(status IN ('suspected', 'confirmed', 'rejected')),
  reviewed_by_id INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (duplicate_complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(primary_complaint_id, duplicate_complaint_id)
);

CREATE INDEX IF NOT EXISTS idx_duplicates_status ON duplicate_relationships(status);

-- System activity and audit log
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
