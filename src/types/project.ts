export interface Project {
  id: string;
  ownerId: string;
  name: string;
  publicKey: string;
  enabled?: boolean;
  createdAt: number;
  updatedAt: number;
}
