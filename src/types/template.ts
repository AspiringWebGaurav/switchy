export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  type: "builtin" | "custom";
  preview: string; // Preview image or gradient
  html: string;
  css: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export interface TemplatePreviewData {
  mode: string;
  message: string;
  buttonText?: string;
  redirect?: string;
}

export const BUILTIN_TEMPLATES: Omit<LayoutTemplate, "userId">[] = [
  {
    id: "glass",
    name: "Glass",
    description: "Modern glassmorphism with blur backdrop",
    type: "builtin",
    preview: "linear-gradient(135deg, #0a1428 0%, #1e3a5f 100%)",
    html: `<div class="switchy-overlay">
  <div class="switchy-glow-1"></div>
  <div class="switchy-glow-2"></div>
  <div class="switchy-content">
    <div class="switchy-icon-wrapper">
      <div class="switchy-icon-ring">
        <div class="switchy-icon">{{ICON}}</div>
      </div>
    </div>
    <div class="switchy-badge"><span class="switchy-badge-dot"></span><span>{{MODE_LABEL}}</span></div>
    <h1 class="switchy-title">{{TITLE}}</h1>
    <p class="switchy-subtitle">{{MESSAGE}}</p>
    <p class="switchy-desc">Our team is working to improve your experience. We'll be back shortly with enhanced performance.</p>
    <div class="switchy-progress"><div class="switchy-progress-bar"></div></div>
    <div class="switchy-progress-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Working on it...</span></div>
    {{#BUTTON}}<a href="{{REDIRECT}}" class="switchy-btn">{{BUTTON_TEXT}}</a>{{/BUTTON}}
    <div class="switchy-features">
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Secure</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Quick</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg><span>Protected</span></div>
    </div>
  </div>
  <div class="switchy-footer"><span class="switchy-footer-dot"></span>Protected by <a href="https://switchyy.com">Switchyy</a></div>
</div>`,
    css: `@keyframes switchy-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes switchy-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes switchy-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.switchy-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 20, 40, 0.35);
  backdrop-filter: blur(35px);
  -webkit-backdrop-filter: blur(35px);
  font-family: system-ui, -apple-system, sans-serif;
}
.switchy-glow-1 {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 15% 20%, rgba(99,102,241,0.15) 0%, transparent 70%);
  pointer-events: none;
}
.switchy-glow-2 {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 50% at 85% 80%, rgba(59,130,246,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.switchy-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 24px;
  max-width: 520px;
}
.switchy-icon-wrapper {
  margin-bottom: 32px;
  animation: switchy-float 3s ease-in-out infinite;
}
.switchy-icon-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
}
.switchy-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.2);
  color: #d97706;
}
.switchy-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.switchy-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d97706;
  animation: switchy-pulse 2s ease-in-out infinite;
}
.switchy-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  line-height: 1.2;
  letter-spacing: -0.025em;
}
.switchy-subtitle {
  margin: 0 0 8px;
  font-size: 16px;
  color: rgba(255,255,255,0.6);
  line-height: 1.5;
}
.switchy-desc {
  margin: 0;
  max-width: 400px;
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  line-height: 1.7;
}
.switchy-progress {
  width: 100%;
  max-width: 280px;
  height: 4px;
  margin-top: 32px;
  border-radius: 2px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
}
.switchy-progress-bar {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, #d97706, transparent);
  background-size: 200% 100%;
  animation: switchy-shimmer 2s linear infinite;
}
.switchy-progress-label {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.switchy-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #d97706;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
  transition: all 0.2s ease;
}
.switchy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
}
.switchy-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.switchy-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255,255,255,0.4);
}
.switchy-feature svg {
  color: rgba(255,255,255,0.5);
}
.switchy-footer {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.02em;
}
.switchy-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(34,197,94,0.8);
}
.switchy-footer a {
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}
.switchy-footer a:hover {
  color: rgba(255,255,255,0.85);
}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean white background with subtle shadows",
    type: "builtin",
    preview: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    html: `<div class="switchy-overlay">
  <div class="switchy-content">
    <div class="switchy-icon-wrapper">
      <div class="switchy-icon">{{ICON}}</div>
    </div>
    <div class="switchy-badge"><span class="switchy-badge-dot"></span><span>{{MODE_LABEL}}</span></div>
    <h1 class="switchy-title">{{TITLE}}</h1>
    <p class="switchy-subtitle">{{MESSAGE}}</p>
    <p class="switchy-desc">Our team is working to improve your experience. We'll be back shortly.</p>
    <div class="switchy-progress"><div class="switchy-progress-bar"></div></div>
    <div class="switchy-progress-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Working on it...</span></div>
    {{#BUTTON}}<a href="{{REDIRECT}}" class="switchy-btn">{{BUTTON_TEXT}}</a>{{/BUTTON}}
    <div class="switchy-features">
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Secure</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Quick</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg><span>Protected</span></div>
    </div>
  </div>
  <div class="switchy-footer"><span class="switchy-footer-dot"></span>Protected by <a href="https://switchyy.com">Switchyy</a></div>
</div>`,
    css: `@keyframes switchy-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.switchy-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
}
.switchy-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 24px;
  max-width: 520px;
}
.switchy-icon-wrapper {
  margin-bottom: 32px;
}
.switchy-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  box-shadow: 0 4px 20px rgba(217,119,6,0.15);
  color: #d97706;
}
.switchy-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 8px 16px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.switchy-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d97706;
}
.switchy-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.025em;
}
.switchy-subtitle {
  margin: 0 0 8px;
  font-size: 16px;
  color: #475569;
  line-height: 1.5;
}
.switchy-desc {
  margin: 0;
  max-width: 400px;
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.7;
}
.switchy-progress {
  width: 100%;
  max-width: 280px;
  height: 4px;
  margin-top: 32px;
  border-radius: 2px;
  background: #e2e8f0;
  overflow: hidden;
}
.switchy-progress-bar {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, #d97706, transparent);
  background-size: 200% 100%;
  animation: switchy-shimmer 2s linear infinite;
}
.switchy-progress-label {
  margin-top: 12px;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.switchy-btn {
  margin-top: 32px;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: #0f172a;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}
.switchy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
.switchy-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}
.switchy-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #94a3b8;
}
.switchy-feature svg {
  color: #64748b;
}
.switchy-footer {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
}
.switchy-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}
.switchy-footer a {
  color: #64748b;
  text-decoration: none;
  font-weight: 600;
}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "gradient",
    name: "Gradient",
    description: "Vibrant gradient background with glow effects",
    type: "builtin",
    preview: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
    html: `<div class="switchy-overlay">
  <div class="switchy-content">
    <div class="switchy-icon-wrapper">
      <div class="switchy-icon-ring">
        <div class="switchy-icon">{{ICON}}</div>
      </div>
    </div>
    <div class="switchy-badge"><span class="switchy-badge-dot"></span><span>{{MODE_LABEL}}</span></div>
    <h1 class="switchy-title">{{TITLE}}</h1>
    <p class="switchy-subtitle">{{MESSAGE}}</p>
    <p class="switchy-desc">Our team is working to improve your experience. We'll be back shortly.</p>
    <div class="switchy-progress"><div class="switchy-progress-bar"></div></div>
    <div class="switchy-progress-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Working on it...</span></div>
    {{#BUTTON}}<a href="{{REDIRECT}}" class="switchy-btn">{{BUTTON_TEXT}}</a>{{/BUTTON}}
    <div class="switchy-features">
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Secure</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Quick</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg><span>Protected</span></div>
    </div>
  </div>
  <div class="switchy-footer"><span class="switchy-footer-dot"></span>Protected by <a href="https://switchyy.com">Switchyy</a></div>
</div>`,
    css: `@keyframes switchy-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes switchy-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes switchy-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.switchy-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  font-family: system-ui, -apple-system, sans-serif;
}
.switchy-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 24px;
  max-width: 520px;
}
.switchy-icon-wrapper {
  margin-bottom: 32px;
  animation: switchy-float 3s ease-in-out infinite;
}
.switchy-icon-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  padding: 3px;
  background: rgba(255,255,255,0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.switchy-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.95);
  color: #8b5cf6;
}
.switchy-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.switchy-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  animation: switchy-pulse 2s ease-in-out infinite;
}
.switchy-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 20px rgba(0,0,0,0.15);
}
.switchy-subtitle {
  margin: 0 0 8px;
  font-size: 16px;
  color: rgba(255,255,255,0.85);
  line-height: 1.5;
}
.switchy-desc {
  margin: 0;
  max-width: 400px;
  font-size: 14px;
  color: rgba(255,255,255,0.65);
  line-height: 1.7;
}
.switchy-progress {
  width: 100%;
  max-width: 280px;
  height: 4px;
  margin-top: 32px;
  border-radius: 2px;
  background: rgba(255,255,255,0.2);
  overflow: hidden;
}
.switchy-progress-bar {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, #fff, transparent);
  background-size: 200% 100%;
  animation: switchy-shimmer 2s linear infinite;
}
.switchy-progress-label {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.switchy-btn {
  margin-top: 32px;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #8b5cf6;
  background: #fff;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
}
.switchy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}
.switchy-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.15);
}
.switchy-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
}
.switchy-feature svg {
  color: rgba(255,255,255,0.75);
}
.switchy-footer {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}
.switchy-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(34,197,94,0.9);
}
.switchy-footer a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-weight: 600;
}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "dark",
    name: "Dark",
    description: "Sleek dark theme with subtle accents",
    type: "builtin",
    preview: "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    html: `<div class="switchy-overlay">
  <div class="switchy-grid"></div>
  <div class="switchy-glow"></div>
  <div class="switchy-content">
    <div class="switchy-icon-wrapper">
      <div class="switchy-icon">{{ICON}}</div>
    </div>
    <div class="switchy-badge"><span class="switchy-badge-dot"></span><span>{{MODE_LABEL}}</span></div>
    <h1 class="switchy-title">{{TITLE}}</h1>
    <p class="switchy-subtitle">{{MESSAGE}}</p>
    <p class="switchy-desc">Our team is working to improve your experience. We'll be back shortly.</p>
    <div class="switchy-progress"><div class="switchy-progress-bar"></div></div>
    <div class="switchy-progress-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Working on it...</span></div>
    {{#BUTTON}}<a href="{{REDIRECT}}" class="switchy-btn">{{BUTTON_TEXT}}</a>{{/BUTTON}}
    <div class="switchy-features">
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Secure</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Quick</span></div>
      <div class="switchy-feature"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg><span>Protected</span></div>
    </div>
  </div>
  <div class="switchy-footer"><span class="switchy-footer-dot"></span>Protected by <a href="https://switchyy.com">Switchyy</a></div>
</div>`,
    css: `@keyframes switchy-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes switchy-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.switchy-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #09090b;
  font-family: system-ui, -apple-system, sans-serif;
}
.switchy-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}
.switchy-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 300px;
  background: radial-gradient(ellipse at center, rgba(217,119,6,0.08) 0%, transparent 70%);
  pointer-events: none;
}
.switchy-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 24px;
  max-width: 520px;
}
.switchy-icon-wrapper {
  margin-bottom: 32px;
}
.switchy-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #18181b;
  border: 1px solid #27272a;
  color: #d97706;
}
.switchy-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 8px 16px;
  border-radius: 999px;
  background: #18181b;
  border: 1px solid #27272a;
  font-size: 12px;
  font-weight: 500;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.switchy-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d97706;
  animation: switchy-pulse 2s ease-in-out infinite;
}
.switchy-title {
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 600;
  color: #fafafa;
  line-height: 1.2;
  letter-spacing: -0.025em;
}
.switchy-subtitle {
  margin: 0 0 8px;
  font-size: 16px;
  color: #a1a1aa;
  line-height: 1.5;
}
.switchy-desc {
  margin: 0;
  max-width: 400px;
  font-size: 14px;
  color: #71717a;
  line-height: 1.7;
}
.switchy-progress {
  width: 100%;
  max-width: 280px;
  height: 4px;
  margin-top: 32px;
  border-radius: 2px;
  background: #27272a;
  overflow: hidden;
}
.switchy-progress-bar {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, #d97706, transparent);
  background-size: 200% 100%;
  animation: switchy-shimmer 2s linear infinite;
}
.switchy-progress-label {
  margin-top: 12px;
  font-size: 12px;
  color: #71717a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.switchy-btn {
  margin-top: 32px;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #09090b;
  background: #fafafa;
  text-decoration: none;
  transition: all 0.2s ease;
}
.switchy-btn:hover {
  transform: translateY(-2px);
  background: #e4e4e7;
}
.switchy-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #27272a;
}
.switchy-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #71717a;
}
.switchy-feature svg {
  color: #a1a1aa;
}
.switchy-footer {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #52525b;
}
.switchy-footer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
}
.switchy-footer a {
  color: #71717a;
  text-decoration: none;
  font-weight: 600;
}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
