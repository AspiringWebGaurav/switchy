export interface UserPreferences {
  devOverlayEnabled?: boolean;      // false = explicitly disable dev overlay globally
  devBlocklist?: string[];           // suppress overlay on these specific hostname[:port] patterns
  domainAllowlist?: string[];        // empty = show on all production domains
  domainBlocklist?: string[];        // domains to never show on
}

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  preferences?: UserPreferences;
  createdAt: number;
  updatedAt: number;
}
