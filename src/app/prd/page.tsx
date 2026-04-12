import { readFileSync } from "fs";
import { join } from "path";

export default function PRDPage() {
  const md = readFileSync(join(process.cwd(), "docs/product-requirements.md"), "utf-8");

  // Simple markdown to HTML (no external deps)
  const html = md
    .replace(/^### (.+)$/gm, '<h3 class="mt-8 mb-3 text-lg font-bold text-gray-900">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-10 mb-4 text-xl font-bold text-gray-900 border-b pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 ml-4 my-1"><input type="checkbox" disabled class="mt-1" /><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 my-1">$1</li>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split("|").map((c: string) => c.trim());
      return `<tr>${cells.map((c: string) => `<td class="border px-3 py-1 text-sm">${c}</td>`).join("")}</tr>`;
    })
    .replace(/^```[\s\S]*?```$/gm, (block) => {
      const code = block.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
      return `<pre class="bg-gray-100 rounded-lg p-4 text-sm overflow-x-auto my-3 font-mono">${code}</pre>`;
    })
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^---$/gm, '<hr class="my-6 border-gray-200" />')
    .replace(/\n\n/g, '<div class="h-3"></div>');

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <p className="mt-12 text-sm text-gray-400 text-center">
          NoPay FreeLunch PRD v1.0
        </p>
      </div>
    </div>
  );
}
