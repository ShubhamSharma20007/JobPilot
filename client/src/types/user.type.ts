export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  google_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  resume_id: string | null;
}