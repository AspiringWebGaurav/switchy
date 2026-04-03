export interface Project {
  id: string;
  ownerId: string;
  name: string;
  publicKey: string;
  detected?: boolean;
  enabled?: boolean;
  activeTemplateId?: string; // ID of custom template to use, or undefined for default (glass)
  createdAt: number;
  updatedAt: number;
}
