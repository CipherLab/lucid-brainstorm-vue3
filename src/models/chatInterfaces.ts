export interface Message {
  id: string;
  sender: string;
  message: string | null;
  createdAt: number;
  error: boolean;
  typing?: boolean;
  selected: boolean;
  isEnabled: boolean;
}
