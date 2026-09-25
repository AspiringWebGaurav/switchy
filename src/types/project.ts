export interface ProjectVisibilitySettings {
  devOverlayEnabled?: boolean | null;   // null = inherit user pref
  devBlocklist?: string[] | null;        // null = inherit user pref
  domainAllowlist?: string[] | null;    // null = inherit user pref
  domainBlocklist?: string[] | null;    // null = inherit user pref
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  publicKey: string;
  detected?: boolean;
  enabled?: boolean;
  activeTemplateId?: string; // ID of custom template to use, or undefined for default (glass)
  settings?: ProjectVisibilitySettings;
  createdAt: number;
  updatedAt: number;
}
