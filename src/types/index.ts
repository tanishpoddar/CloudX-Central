

export type UserRole = 'Co-founder' | 'Secretary' | 'Chair of Directors' | 'Lead' | 'Member';

export type Team = 'Technology' | 'Corporate' | 'Creatives' | 'Presidium';

export type SubTeam =
  | 'dev'
  | 'ui-ux'
  | 'aiml'
  | 'cloud'
  | 'iot'
  | 'events'
  | 'ops'
  | 'pr'
  | 'sponsorship'
  | 'digital-design'
  | 'media';

export interface User {
  id: string;
  name: string;
  username: string;
  regNo?: string | null;
  password?: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  team: Team | null;
  secondaryTeam?: Team | null;
  subTeam: SubTeam | null;
  birthday?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  github?: string | null;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  urgent: boolean;
  assignedToIds?: string[];
  assignedToId?: string; // Can be undefined for unassigned tasks
  assignedById: string;
  createdAt: string;
  dueDate: string;
  links: string[];
}

export interface Log {
    id: string;
    message: string;
    timestamp: string;
    userId: string;
    taskId?: string;
}

export interface Comment {
    id: string;
    taskId: string;
    userId: string;
    message: string;
    createdAt: string;
}

export interface Subtask {
    id: string;
    taskId: string;
    title: string;
    isCompleted: boolean;
    createdAt: string;
    order: number;
}

export interface Notification {
    id: string;
    userId: string; // The user who receives the notification
    actorId: string; // The user who performed the action
    type: 'TASK_ASSIGNED' | 'STATUS_UPDATED' | 'COMMENT_ADDED' | 'DEADLINE_APPROACHING' | 'ANNOUNCEMENT_NEW';
    message: string; // HTML-enabled message
    link: string; // Link to the relevant page (e.g., task details)
    isRead: boolean;
    createdAt: string;
    taskId?: string;
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  question: string;
  options: PollOption[];
}

export interface PollVote {
    announcementId: string;
    userId: string;
    optionId: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: string;
    links?: string[];
    poll?: Poll;
    targetDomains?: Team[];
}

export interface AnnouncementReaction {
    id: string;
    announcementId: string;
    userId: string;
    emoji: string;
}

export interface AnnouncementComment {
    id: string;
    announcementId: string;
    userId: string;
    message: string;
    createdAt: string;
}

export interface PasswordResetToken {
    id: string; // email
    token: string;
    expires: Date;
    userId: string;
}

    
