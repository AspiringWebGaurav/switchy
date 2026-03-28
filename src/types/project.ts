export interface Project {
  id: string;
  ownerId: string;
  name: string;
  publicKey: string;
  detected?: boolean;
  enabled?: boolean;
  createdAt: number;
  updatedAt: number;
}
