export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'lead' | 'qa' | 'user';
  avatar?: string;
}