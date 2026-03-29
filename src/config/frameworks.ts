import {
  siHtml5,
  siReact,
  siNextdotjs,
  siVuedotjs,
  siNuxt,
  siSvelte,
  siAstro,
  siRemix,
  siAngular,
  siGatsby,
} from "simple-icons";

export type FrameworkId = 
  | "html" 
  | "react" 
  | "nextjs" 
  | "vue" 
  | "nuxt" 
  | "svelte" 
  | "astro" 
  | "remix" 
  | "angular" 
  | "gatsby";

export interface Framework {
  id: FrameworkId;
  label: string;
  svg: string;
  hex: string;
  file: string;
}

export const frameworks: Framework[] = [
  { id: "html", label: "HTML", svg: siHtml5.svg, hex: siHtml5.hex, file: "index.html" },
  { id: "react", label: "React", svg: siReact.svg, hex: siReact.hex, file: "public/index.html" },
  { id: "nextjs", label: "Next.js", svg: siNextdotjs.svg, hex: siNextdotjs.hex, file: "app/layout.tsx" },
  { id: "vue", label: "Vue", svg: siVuedotjs.svg, hex: siVuedotjs.hex, file: "index.html" },
  { id: "nuxt", label: "Nuxt", svg: siNuxt.svg, hex: siNuxt.hex, file: "nuxt.config.ts" },
  { id: "svelte", label: "Svelte", svg: siSvelte.svg, hex: siSvelte.hex, file: "src/app.html" },
  { id: "astro", label: "Astro", svg: siAstro.svg, hex: siAstro.hex, file: "src/layouts/Layout.astro" },
  { id: "remix", label: "Remix", svg: siRemix.svg, hex: siRemix.hex, file: "app/root.tsx" },
  { id: "angular", label: "Angular", svg: siAngular.svg, hex: siAngular.hex, file: "src/index.html" },
  { id: "gatsby", label: "Gatsby", svg: siGatsby.svg, hex: siGatsby.hex, file: "gatsby-ssr.js" },
];

export function getSnippet(fw: FrameworkId, scriptUrl: string): string {
  const hideStyle = `<style id="switchy-hide">html{visibility:hidden!important;background:#fff}</style>`;
  
  const snippets: Record<FrameworkId, string> = {
    html: `<!-- Add to <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`,
    react: `<!-- Add to public/index.html <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`,
    nextjs: `// app/layout.tsx
import Script from "next/script";

// In <head>:
<style id="switchy-hide" dangerouslySetInnerHTML={{
  __html: "html{visibility:hidden!important;background:#fff}"
}} />
<Script src="${scriptUrl}" strategy="beforeInteractive" />`,
    vue: `<!-- Add to index.html <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`,
    nuxt: `// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [{ src: "${scriptUrl}" }],
      style: [{ children: "html{visibility:hidden!important;background:#fff}", id: "switchy-hide" }]
    }
  }
})`,
    svelte: `<!-- src/app.html <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`,
    astro: `<!-- src/layouts/Layout.astro <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`,
    remix: `// app/root.tsx
import { Links, Meta, Scripts } from "@remix-run/react";

// In <head>:
<style id="switchy-hide" dangerouslySetInnerHTML={{
  __html: "html{visibility:hidden!important;background:#fff}"
}} />
<script src="${scriptUrl}" />`,
    angular: `<!-- src/index.html <head> -->\n${hideStyle}\n<script src="${scriptUrl}"></script>`,
    gatsby: `// gatsby-ssr.js
export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <style key="switchy-hide" id="switchy-hide" dangerouslySetInnerHTML={{
      __html: "html{visibility:hidden!important;background:#fff}"
    }} />,
    <script key="switchy" src="${scriptUrl}" />
  ]);
};`,
  };
  
  return snippets[fw];
}
