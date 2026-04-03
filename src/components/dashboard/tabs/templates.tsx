"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Plus,
  Eye,
  Edit3,
  Trash2,
  X,
  Check,
  Code2,
  Maximize2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  RotateCcw,
  Power,
  Zap,
} from "lucide-react";
import { BUILTIN_TEMPLATES, type LayoutTemplate } from "@/types/template";
import { modes } from "@/components/modes/mode-selector";

interface Project {
  id: string;
  name: string;
  publicKey: string;
  mode: string;
  enabled?: boolean;
  detected?: boolean;
  activeTemplateId?: string;
}

interface ProjectTemplatesProps {
  project: Project;
  onRefresh: () => void;
}

const modeIcons: Record<string, string> = {
  maintenance: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.048.58.024 1.194-.14 1.743"></path></svg>',
  offline: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M8.111 8.111A5.97 5.97 0 006 12c0 .337.028.666.081.988M12.5 6.029A6 6 0 0118 12c0 .337-.028.666-.081.988M9 9a3 3 0 013-3 3 3 0 013 3M9 9l6 6M12 12v.01"></path></svg>',
  preview: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
  medical: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"></path></svg>',
  migrating: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"></path></svg>',
  "coming-soon": '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
  incident: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path></svg>',
  launching: '<svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path></svg>',
};

const defaultMessages: Record<string, string> = {
  maintenance: "We're currently performing maintenance.",
  offline: "This service is currently offline.",
  preview: "You're viewing a preview environment.",
  medical: "Our team is currently on leave.",
  migrating: "We're migrating to a new platform.",
  "coming-soon": "Coming soon!",
  incident: "We're experiencing an incident.",
  launching: "Launching soon — stay tuned!",
};

export function ProjectTemplates({ project, onRefresh }: ProjectTemplatesProps) {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LayoutTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState("maintenance");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LayoutTemplate | null>(null);
  const [customTemplates, setCustomTemplates] = useState<LayoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(project.activeTemplateId || null);
  const [activating, setActivating] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Sync activeTemplateId with project prop
  useEffect(() => {
    setActiveTemplateId(project.activeTemplateId || null);
  }, [project.activeTemplateId]);

  // Load custom templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch(`/api/v1/projects/${project.id}/templates`);
        if (res.ok) {
          const { data } = await res.json();
          setCustomTemplates(data.templates || []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, [project.id]);

  // Combine builtin and custom templates
  useEffect(() => {
    setTemplates([...BUILTIN_TEMPLATES, ...customTemplates]);
  }, [customTemplates]);

  const previewModes = modes.filter(m => !['live', 'custom'].includes(m.value)).slice(0, 4);

  const modeTitles: Record<string, string> = {
    maintenance: "Scheduled Maintenance",
    offline: "Service Offline",
    preview: "Preview Environment",
    medical: "Team On Leave",
    incident: "Service Incident",
    migrating: "Migration In Progress",
    "coming-soon": "Coming Soon",
    launching: "Launching Soon",
  };

  function generatePreviewHTML(template: LayoutTemplate, mode: string): string {
    const message = defaultMessages[mode] || "This site is currently unavailable.";
    const icon = modeIcons[mode] || modeIcons.maintenance;
    const title = modeTitles[mode] || mode.charAt(0).toUpperCase() + mode.slice(1);
    const modeLabel = mode.replace(/-/g, " ");
    
    let html = template.html
      .replace(/\{\{ICON\}\}/g, icon)
      .replace(/\{\{MESSAGE\}\}/g, message)
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{MODE_LABEL\}\}/g, modeLabel)
      .replace(/\{\{#BUTTON\}\}[\s\S]*?\{\{\/BUTTON\}\}/g, "");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    ${template.css}
  </style>
</head>
<body>${html}</body>
</html>`;
  }

  async function handleSaveTemplate(template: LayoutTemplate) {
    try {
      const method = template.id && customTemplates.find(t => t.id === template.id) ? "PUT" : "POST";
      const res = await fetch(`/api/v1/projects/${project.id}/templates`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (method === "POST") {
          setCustomTemplates([...customTemplates, data.template]);
        } else {
          setCustomTemplates(customTemplates.map(t => t.id === template.id ? data.template : t));
        }
        setShowEditor(false);
        setEditingTemplate(null);
      }
    } catch {
      // Handle error
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/templates/${templateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
        if (selectedTemplate?.id === templateId) setSelectedTemplate(null);
        // If deleted template was active, refresh project data
        if (project.activeTemplateId === templateId) {
          onRefresh();
        }
      }
    } catch {
      // Handle error
    }
  }

  async function handleActivateTemplate(templateId: string) {
    setActivating(templateId);
    // Optimistic update
    setActiveTemplateId(templateId);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/templates/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) {
        // Revert on error
        setActiveTemplateId(project.activeTemplateId || null);
      }
    } catch {
      // Revert on error
      setActiveTemplateId(project.activeTemplateId || null);
    } finally {
      setActivating(null);
    }
  }

  async function handleDeactivateTemplate() {
    const previousId = activeTemplateId;
    // Optimistic update
    setActiveTemplateId(null);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/templates/activate`, {
        method: "DELETE",
      });
      if (!res.ok) {
        // Revert on error
        setActiveTemplateId(previousId);
      }
    } catch {
      // Revert on error
      setActiveTemplateId(previousId);
    }
  }

  function openEditor(template?: LayoutTemplate) {
    if (template) {
      // Copy the template for editing
      setEditingTemplate({ 
        ...template,
        id: template.type === 'builtin' ? '' : template.id, // Clear ID if copying a built-in
        name: template.type === 'builtin' ? `${template.name} Copy` : template.name,
        type: 'custom',
      });
    } else if (selectedTemplate) {
      // Use selected template as base
      setEditingTemplate({
        ...selectedTemplate,
        id: '',
        name: `${selectedTemplate.name} Copy`,
        type: 'custom',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      // Start with minimal empty template
      setEditingTemplate({
        id: "",
        name: "My Template",
        description: "Custom overlay template",
        type: "custom",
        preview: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        html: `<div class="switchy-overlay">
  <div class="switchy-content">
    <div class="switchy-icon">{{ICON}}</div>
    <h1 class="switchy-title">{{MESSAGE}}</h1>
    {{#BUTTON}}<a href="{{REDIRECT}}" class="switchy-btn">{{BUTTON_TEXT}}</a>{{/BUTTON}}
    <p class="switchy-footer">We'll be back soon</p>
  </div>
</div>`,
        css: `.switchy-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  font-family: system-ui, -apple-system, sans-serif;
}
.switchy-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  max-width: 480px;
}
.switchy-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.switchy-title {
  margin: 0 0 16px;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}
.switchy-btn {
  margin-top: 24px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #000;
  background: #fff;
  text-decoration: none;
}
.switchy-footer {
  margin-top: 32px;
  font-size: 12px;
  color: #666;
}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    setShowEditor(true);
  }

  // Fullscreen preview modal
  if (isFullscreen && selectedTemplate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          {previewModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setPreviewMode(mode.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                previewMode === mode.value
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <iframe
          srcDoc={generatePreviewHTML(selectedTemplate, previewMode)}
          className="w-full h-full border-0"
          title="Template Preview"
        />
      </motion.div>
    );
  }

  // Template editor modal
  if (showEditor && editingTemplate) {
    return (
      <TemplateEditor
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onClose={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
        previewMode={previewMode}
        generatePreviewHTML={generatePreviewHTML}
      />
    );
  }

  return (
    <div className="space-y-6" onClick={() => setSelectedTemplate(null)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Layout Templates</h2>
          <p className="text-sm text-stone-500 mt-1">
            Choose how your overlay looks when a mode is active
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); openEditor(); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Custom Template
        </button>
      </div>

      {/* Template Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative rounded-xl border overflow-hidden transition-all cursor-pointer ${
              selectedTemplate?.id === template.id
                ? "border-indigo-500 ring-2 ring-indigo-500/20"
                : "border-stone-200 hover:border-stone-300"
            }`}
            onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t => t?.id === template.id ? null : template); }}
          >
            {/* Preview Thumbnail */}
            <div
              className="aspect-video relative overflow-hidden"
              style={{ background: template.preview }}
            >
              <iframe
                srcDoc={generatePreviewHTML(template, "maintenance")}
                className="w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none"
                title={template.name}
              />
              
              {/* Hover Actions - Center */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate(template);
                    setIsFullscreen(true);
                  }}
                  className="p-2 rounded-lg bg-white/90 hover:bg-white text-stone-700 transition-colors"
                  title="Preview fullscreen"
                >
                  <Maximize2 size={18} />
                </button>
                {template.type === "custom" && (
                  <>
                    {activeTemplateId === template.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeactivateTemplate();
                        }}
                        className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                        title="Deactivate template"
                      >
                        <X size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateTemplate(template.id);
                        }}
                        disabled={activating === template.id}
                        className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                        title="Activate template"
                      >
                        <Zap size={18} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditor(template);
                      }}
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-stone-700 transition-colors"
                      title="Edit template"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="p-2 rounded-lg bg-white/90 hover:bg-white text-red-600 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Badge - Top Left */}
              {template.type === "builtin" && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-medium text-stone-600">
                  Built-in
                </div>
              )}
              {template.type === "custom" && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <div className="px-2 py-0.5 bg-indigo-500/90 backdrop-blur-sm rounded-full text-[10px] font-medium text-white">
                    Custom
                  </div>
                  {activeTemplateId === template.id && (
                    <div className="px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm rounded-full text-[10px] font-medium text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Active
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Right - Activate/Active Button (always visible for custom) */}
              {template.type === "custom" && (
                <div className="absolute bottom-2 right-2">
                  {activeTemplateId === template.id ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500 rounded-lg text-[10px] font-medium text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Active
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateTemplate(template.id);
                      }}
                      disabled={activating === template.id}
                      className="flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-medium text-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <Zap size={12} />
                      {activating === template.id ? "Activating..." : "Activate"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 bg-white">
              <h3 className="font-medium text-stone-900 text-sm">{template.name}</h3>
              <p className="text-xs text-stone-500 mt-0.5">{template.description}</p>
            </div>

            {/* Selected indicator */}
            {selectedTemplate?.id === template.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Add Custom Template Card */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={(e) => { e.stopPropagation(); openEditor(); }}
          className="group relative rounded-xl border-2 border-dashed border-stone-200 hover:border-indigo-300 overflow-hidden transition-all aspect-video flex flex-col items-center justify-center gap-3 bg-stone-50 hover:bg-indigo-50/50"
        >
          <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
            <Plus size={24} className="text-stone-400 group-hover:text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-stone-600 group-hover:text-indigo-600">
              Add Custom Template
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Paste your own HTML & CSS
            </p>
          </div>
        </motion.button>
      </div>

    </div>
  );
}

// Template Editor Component
interface TemplateEditorProps {
  template: LayoutTemplate;
  onSave: (template: LayoutTemplate) => void;
  onClose: () => void;
  previewMode: string;
  generatePreviewHTML: (template: LayoutTemplate, mode: string) => string;
}

function TemplateEditor({ template, onSave, onClose, previewMode, generatePreviewHTML }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<LayoutTemplate>(template);
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const [previewModeLocal, setPreviewModeLocal] = useState(previewMode);
  const previewModes = modes.filter(m => !['live', 'custom'].includes(m.value)).slice(0, 4);

  function updateField<K extends keyof LayoutTemplate>(field: K, value: LayoutTemplate[K]) {
    setEditedTemplate({ ...editedTemplate, [field]: value, updatedAt: Date.now() });
  }

  function handleSave() {
    const toSave = {
      ...editedTemplate,
      id: editedTemplate.id || `custom-${Date.now()}`,
      type: "custom" as const,
    };
    onSave(toSave);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-stone-900 flex"
    >
      {/* Left: Editor */}
      <div className="w-1/2 flex flex-col border-r border-stone-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700 bg-stone-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-400 transition-colors"
            >
              <X size={18} />
            </button>
            <input
              type="text"
              value={editedTemplate.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="bg-transparent text-white font-medium text-sm border-none outline-none focus:ring-0"
              placeholder="Template Name"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditedTemplate(template)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Save size={14} />
              Save Template
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-700 bg-stone-800">
          <button
            onClick={() => setActiveTab("html")}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "html"
                ? "text-white border-b-2 border-indigo-500"
                : "text-stone-400 hover:text-white"
            }`}
          >
            HTML
          </button>
          <button
            onClick={() => setActiveTab("css")}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "css"
                ? "text-white border-b-2 border-indigo-500"
                : "text-stone-400 hover:text-white"
            }`}
          >
            CSS
          </button>
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          <textarea
            value={activeTab === "html" ? editedTemplate.html : editedTemplate.css}
            onChange={(e) => updateField(activeTab, e.target.value)}
            className="w-full h-full bg-stone-900 text-stone-300 font-mono text-xs p-4 resize-none outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Variables hint */}
        <div className="px-4 py-2 bg-stone-800 border-t border-stone-700 text-xs text-stone-500">
          <span className="text-stone-400">Variables:</span>{" "}
          <code className="text-indigo-400">{"{{TITLE}}"}</code>,{" "}
          <code className="text-indigo-400">{"{{MODE_LABEL}}"}</code>,{" "}
          <code className="text-indigo-400">{"{{MESSAGE}}"}</code>,{" "}
          <code className="text-indigo-400">{"{{ICON}}"}</code>,{" "}
          <code className="text-indigo-400">{"{{#BUTTON}}...{{/BUTTON}}"}</code>,{" "}
          <code className="text-indigo-400">{"{{BUTTON_TEXT}}"}</code>,{" "}
          <code className="text-indigo-400">{"{{REDIRECT}}"}</code>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="w-1/2 flex flex-col bg-black">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-900">
          <div className="flex items-center gap-2 text-stone-400">
            <Eye size={16} />
            <span className="text-xs font-medium">Live Preview</span>
          </div>
          <div className="flex items-center gap-1 bg-stone-800 rounded-lg p-0.5">
            {previewModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPreviewModeLocal(mode.value)}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  previewModeLocal === mode.value
                    ? "bg-white text-stone-900"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 relative">
          <iframe
            srcDoc={generatePreviewHTML(editedTemplate, previewModeLocal)}
            className="w-full h-full border-0"
            title="Live Preview"
          />
        </div>
      </div>
    </motion.div>
  );
}
