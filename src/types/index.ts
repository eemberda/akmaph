export type UserRole = 'superadmin' | 'educator' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isSuperAdmin?: boolean;
  institution?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfileData {
  studentId: string;
  name?: string;
  interests: string;
  goals: string;
  careerAspirations: string;
  dreamProject: string;
  completed: boolean;
  updatedAt?: string;
}

export interface SystemPromptData {
  id: string;
  name: string;
  target: string;
  promptText: string;
  description: string;
  version: number;
  updatedBy: string;
  updatedAt: string;
}

export interface ActivityData {
  id: string;
  educatorId: string;
  educatorEmail: string;
  educatorName: string;
  title: string;
  type: 'activity' | 'assessment';
  subject: string;
  gradeLevel: string;
  instructions: string;
  referenceMaterials: string;
  pedagogicalBasis: string;
  joinCode: string;
  invitedEmails: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InteractionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pedagogicalNote?: string;
  timestamp: string;
}

export interface RubricCriteria {
  criteria: string;
  score: number;
  maxScore: number;
  comment?: string;
}

export interface EvaluationResult {
  suggestedScore: number;
  maxScore: number;
  strengths: string;
  areasForGrowth: string;
  feedback: string;
  rubricBreakdown: RubricCriteria[];
}

export interface StudentSubmissionData {
  id: string;
  activityId: string;
  educatorId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  personalizedContent: string;
  personalizationRationale?: string;
  studentAnswer: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'graded';
  suggestedScore?: number;
  maxScore?: number;
  feedback?: string;
  rubricAnalysis?: string;
  rubricBreakdown?: RubricCriteria[];
  submittedAt?: string;
  gradedAt?: string;
  updatedAt?: string;
}

export interface CoachChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UsageLogItem {
  id: string;
  userId: string;
  userEmail: string;
  role: string;
  action: string;
  model: string;
  estimatedTokens: number;
  timestamp: string;
}
