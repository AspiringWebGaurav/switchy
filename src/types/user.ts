export interface UserPreferences {
  devOverlayEnabled?: boolean;      // default: false (dev blocked)
  domainAllowlist?: string[];       // empty = show on all production domains
  domainBlocklist?: string[];       // domains to never show on
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
