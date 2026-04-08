export interface ApiResponse<T = unknown> {
  status: "ok" | "error";
  data?: T;
  error?: string;
}

export interface VisibilityConfig {
  devOverlayEnabled: boolean;
  domainAllowlist: string[];
  domainBlocklist: string[];
}

export interface DecisionResponse {
  mode: string;
  message: string | null;
  buttonText: string | null;
  redirect: string | null;
  timestamp: number;
  pending?: boolean;
  template?: {
    html: string;
    css: string;
  };
  visibility?: VisibilityConfig;
}
