// Simple authentication service for demo purposes
// In production, this would connect to a real database and use proper password hashing

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super-admin' | 'admin' | 'lead' | 'qa' | 'user';
  name: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Default admin user seeded for production environments
const DEFAULT_ADMIN_USER: User & { password: string } = {
  id: 'admin',
  username: 'admin',
  email: 'admin@merquri.io',
  password: 'Password888!',
  role: 'super-admin',
  name: 'System Administrator'
};

const DEMO_USERS: (User & { password: string })[] = [DEFAULT_ADMIN_USER];

const USERS_STORAGE_KEY = 'testCaseWriter_users';

export class AuthService {
  private static readonly AUTH_TOKEN_KEY = 'testCaseWriter_auth_token';
  private static readonly USER_KEY = 'testCaseWriter_currentUser';

  /**
   * Initialize users in localStorage with demo data if not exists or force update
   */
  private static initializeUsers(forceUpdate: boolean = false): void {
    if (typeof window === 'undefined') return;

    const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!existingUsers || forceUpdate) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEMO_USERS));
      console.log('🔧 AUTH DEBUG - Users initialized/updated in localStorage:', DEMO_USERS.map(u => ({ username: u.username, role: u.role })));
    }
  }

  /**
   * Get all stored users (with passwords)
   */
  private static getStoredUsers(): (User & { password: string })[] {
    if (typeof window === 'undefined') return DEMO_USERS;

    this.initializeUsers();
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const sanitized = this.sanitizeUsers(Array.isArray(parsed) ? parsed : []);
      this.saveUsers(sanitized);
      return sanitized;
    } catch {
      this.saveUsers(DEMO_USERS);
      return DEMO_USERS;
    }
  }

  private static sanitizeUsers(users: Array<User & { password: string }>): Array<User & { password: string }> {
    const disallowedUsernames = new Set(['sarah', 'mike', 'demo', 'guest']);
    const disallowedEmails = new Set(['admin@yopmail.com', 'sarah@yopmail.com', 'mike@yopmail.com']);
    const uniqueByUsername = new Map<string, User & { password: string }>();

    users.forEach(candidate => {
      if (!candidate || typeof candidate !== 'object') {
        return;
      }

      const username = (candidate.username ?? '').toLowerCase();
      const email = (candidate.email ?? '').toLowerCase();

      if (!username || disallowedUsernames.has(username) || disallowedEmails.has(email)) {
        return;
      }

      uniqueByUsername.set(username, candidate);
    });

    const sanitized = Array.from(uniqueByUsername.values());
    const adminUsername = DEFAULT_ADMIN_USER.username.toLowerCase();
    const adminEmail = DEFAULT_ADMIN_USER.email.toLowerCase();

    const adminIndex = sanitized.findIndex(user => {
      const username = user.username?.toLowerCase() ?? '';
      const email = user.email?.toLowerCase() ?? '';
      return username == adminUsername || email == adminEmail;
    });

    if (adminIndex >= 0) {
      sanitized[adminIndex] = { ...sanitized[adminIndex], ...DEFAULT_ADMIN_USER };
    } else {
      sanitized.unshift({ ...DEFAULT_ADMIN_USER });
    }

    return sanitized;
  }

  /**
   * Save users to localStorage
   */
  private static saveUsers(users: (User & { password: string })[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Authenticate user with username and password
   */
  static async authenticate(credentials: LoginCredentials): Promise<User | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getStoredUsers();
    console.log('🔍 AUTH DEBUG - All users:', users.map(u => ({ id: u.id, username: u.username, email: u.email })));
    console.log('🔍 AUTH DEBUG - Login attempt:', { username: credentials.username, passwordLength: credentials.password?.length });

    const user = users.find(u =>
      (u.username === credentials.username || u.email === credentials.username) &&
      u.password === credentials.password
    );

    console.log('🔍 AUTH DEBUG - Found user:', user ? { id: user.id, username: user.username, email: user.email } : 'None');

    if (user) {
      const { password, ...userWithoutPassword } = user;
      this.setCurrentUser(userWithoutPassword);
      console.log('🔍 AUTH DEBUG - Login successful');
      return userWithoutPassword;
    }

    console.log('🔍 AUTH DEBUG - Login failed');
    return null;
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        this.logout();
        return null;
      }
    }
    return null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Check if user has required role
   */
  static hasRole(requiredRole: string | string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  }

  /**
   * Check if user can access a specific resource
   */
  static canAccess(resource: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Role-based access control
    switch (resource) {
      case 'admin':
        return ['super-admin', 'admin'].includes(user.role);

      case 'user-management':
        return ['super-admin', 'admin', 'lead'].includes(user.role);

      case 'team-management':
        return ['super-admin', 'admin', 'lead'].includes(user.role);

      case 'create-runs':
        return ['super-admin', 'lead'].includes(user.role);

      case 'execute-tests':
        return ['super-admin', 'lead', 'qa'].includes(user.role);

      case 'view-reports':
        return true; // All authenticated users

      default:
        return false;
    }
  }

  /**
   * Set current user in storage
   */
  private static setCurrentUser(user: User): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.AUTH_TOKEN_KEY, `demo_token_${user.id}_${Date.now()}`);

    // Dispatch user update event for other components
    window.dispatchEvent(new Event('userUpdated'));
  }

  /**
   * Logout current user
   */
  static logout(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);

    // Dispatch user update event for other components
    window.dispatchEvent(new Event('userUpdated'));
  }

  /**
   * Get all users (admin only)
   */
  static getAllUsers(): User[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !this.canAccess('user-management')) {
      return [];
    }

    const users = this.getStoredUsers();
    return users.map(({ password, ...user }) => user);
  }

  /**
   * Get user by ID
   */
  static getUserById(id: string): User | null {
    const user = DEMO_USERS.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  /**
   * Update user (admin/lead only)
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !this.canAccess('user-management')) {
      return false;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    users[userIndex] = { ...users[userIndex], ...updates };
    this.saveUsers(users);
    return true;
  }

  /**
   * Create a new user
   */
  static async createUser(userData: {
    email: string;
    name: string;
    username?: string;
    password: string;
    role: 'super-admin' | 'admin' | 'lead' | 'qa' | 'user';
  }): Promise<User | null> {
    try {
      const users = this.getStoredUsers();

      // Check if user already exists by email
      const existingUserByEmail = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUserByEmail) {
        throw new Error('User with this email already exists');
      }

      // Check if username already exists (if provided)
      if (userData.username) {
        const existingUserByUsername = users.find(u => u.username?.toLowerCase() === userData.username!.toLowerCase());
        if (existingUserByUsername) {
          throw new Error('User with this username already exists');
        }
      }

      // Generate user ID
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newUser: User & { password: string } = {
        id: newUserId,
        email: userData.email.toLowerCase().trim(),
        name: userData.name.trim(),
        username: userData.username?.trim() || userData.email.split('@')[0],
        password: userData.password, // Store password as plain text (demo purposes)
        role: userData.role
      };

      users.push(newUser);
      this.saveUsers(users);

      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser || !this.canAccess('user-management')) {
        console.error('Permission denied for user deletion');
        return false;
      }

      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        console.error('User not found for deletion:', userId);
        return false;
      }

      const userToDelete = users[userIndex];

      // Don't allow deleting super-admin users
      if (userToDelete.role === 'super-admin') {
        console.error('Cannot delete super-admin user');
        return false;
      }

      // Remove user from array
      users.splice(userIndex, 1);
      this.saveUsers(users);

      console.log('User deleted successfully:', userId);
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

      if (userIndex === -1) {
        console.error('User not found for password update:', email);
        return false;
      }

      // Update password (using same plain text storage as demo)
      users[userIndex].password = newPassword;
      this.saveUsers(users);

      console.log('Password updated successfully for user:', email);
      return true;
    } catch (error) {
      console.error('Failed to update password:', error);
      return false;
    }
  }

  /**
   * Force reset users to demo data (for debugging)
   */
  static resetDemoUsers(): void {
    if (typeof window === 'undefined') return;

    console.log('🔧 AUTH DEBUG - Forcing reset of demo users');
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEMO_USERS));
    console.log('🔧 AUTH DEBUG - Demo users reset completed:', DEMO_USERS.map(u => ({ username: u.username, role: u.role })));
  }

  /**
   * Get role permissions
   */
  static getRolePermissions(role: string): string[] {
    switch (role) {
      case 'super-admin':
        return ['*']; // All permissions

      case 'admin':
        return [
          'manage-users',
          'manage-teams',
          'view-all-runs',
          'create-runs',
          'manage-runs',
          'view-reports'
        ];

      case 'lead':
        return [
          'view-team-runs',
          'create-runs',
          'manage-team-runs',
          'assign-testers',
          'view-reports'
        ];

      case 'qa':
      case 'user':
        return [
          'execute-tests',
          'view-own-runs',
          'view-own-reports'
        ];

      default:
        return [];
    }
  }
}