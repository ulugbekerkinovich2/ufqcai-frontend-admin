export type RiskLevel = "None" | "Low" | "Medium" | "High";

export type ReviewStatus = "pending_triage" | "assigned" | "rejected" | "evaluated";

export interface Document {
  id: string;
  title: string;
  original_name: string;
  file_type: string;
  file_size: number;
  page_count?: number;
  status: string;
  created_at: string;
  extracted_text?: string;
  review_status: ReviewStatus;
  assigned_expert_id?: string;
  assigned_at?: string;
  reject_reason?: string;
}

export interface ExpertReviewItem {
  id: string;
  criterion_id?: string;
  criterion_name?: string;
  risk_level?: RiskLevel;
  score?: number | string;
  comment?: string;
  agrees_with_ai?: boolean | null;
}

export interface ExpertReview {
  id: string;
  document_id: string;
  expert_id: string;
  overall_verdict?: "approved" | "rejected" | "needs_revision";
  overall_comment?: string;
  status: "draft" | "submitted";
  submitted_at?: string;
  items: ExpertReviewItem[];
}

export interface Criterion {
  id: string;
  name: string;
  description?: string;
  ai_instruction: string;
  weight: number | string;
  category?: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Law {
  id: string;
  title: string;
  doc_number?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface FlaggedSegment {
  id: string;
  criterion_id?: string;
  criterion_name?: string;
  quote: string;
  char_start?: number;
  char_end?: number;
  risk_level?: RiskLevel;
  explanation?: string;
  related_law_id?: string;
}

export interface AnalysisResult {
  id: string;
  criterion_id?: string;
  criterion_name?: string;
  risk_level: RiskLevel;
  score?: number | string;
  finding?: string;
  recommendation?: string;
}

export interface Analysis {
  id: string;
  document_id: string;
  status: "pending" | "running" | "completed" | "failed";
  overall_score?: number | string;
  overall_risk?: RiskLevel;
  summary?: string;
  genre?: string[];
  model_used?: string;
  tokens_used?: number;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  error_message?: string;
  progress_stage?: string | null;
  progress_percent?: number | null;
  progress_message?: string | null;
  results?: AnalysisResult[];
  flagged?: FlaggedSegment[];
}

export type TanlovStatus = "draft" | "announced" | "intake_closed" | "completed" | "cancelled";

export interface Tanlov {
  id: string;
  title: string;
  description?: string;
  film_type?: string;
  status: TanlovStatus;
  application_deadline?: string;
  announced_at?: string;
  created_by?: string;
  created_at: string;
}

export type ArizaStatus =
  | "draft" | "submitted" | "registered" | "reg_rejected" | "scoring"
  | "winner" | "reserve" | "rejected" | "contracted";

export interface Ariza {
  id: string;
  tanlov_id: string;
  applicant_id: string;
  organization_name?: string;
  status: ArizaStatus;
  own_funding_amount?: number | string;
  requested_grant_amount?: number | string;
  total_budget?: number | string;
  literary_screenplay_document_id?: string;
  registration_note?: string;
  submitted_at?: string;
  registered_at?: string;
  decided_at?: string;
  created_at: string;
}

export type ArizaAttachmentKind = "annotation" | "budget_calc" | "calendar_plan" | "sketches" | "presentation" | "other";

export interface ArizaAttachment {
  id: string;
  ariza_id: string;
  kind: ArizaAttachmentKind;
  file_type: string;
  file_size: number;
  original_name: string;
  uploaded_at: string;
}

export interface ArizaScore {
  id: string;
  ariza_id: string;
  member_id: string;
  vote?: "for" | "against" | "abstain";
  score?: number | string;
  comment?: string;
  status: "draft" | "submitted";
  submitted_at?: string;
}

export type RejissorlikSmetaStatus =
  | "pending_ishchi_guruh" | "ishchi_guruh_rejected" | "pending_komissiya" | "approved" | "rejected";

export interface RejissorlikSmeta {
  id: string;
  ariza_id: string;
  director_screenplay_document_id?: string;
  total_cost?: number | string;
  status: RejissorlikSmetaStatus;
  ishchi_guruh_reviewer_id?: string;
  ishchi_guruh_note?: string;
  ishchi_guruh_decided_at?: string;
  komissiya_approved_by?: string;
  komissiya_decided_at?: string;
  submitted_at?: string;
}
