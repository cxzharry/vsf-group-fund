import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/** Parse epic file: extract title from first # heading */
function extractTitle(md: string): string {
  const match = md.match(/^# (.+)$/m);
  return match ? match[1] : "Untitled";
}

/** Minimal markdown → HTML with proper table and code block support */
function mdToHtml(md: string): string {
  // Code blocks first (greedy across lines)
  const html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd();
    return `<pre><code>${escaped}</code></pre>`;
  });

  // Process line by line for everything else
  const lines = html.split("\n");
  const out: string[] = [];
  let inTable = false;
  let tableHeaderDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if inside <pre> block
    if (line.includes("<pre>")) {
      // Find closing </pre> and pass through
      let j = i;
      while (j < lines.length && !lines[j].includes("</pre>")) {
        out.push(lines[j]);
        j++;
      }
      out.push(lines[j] ?? "");
      i = j;
      continue;
    }

    // Tables
    if (line.startsWith("|")) {
      // Skip separator row (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(line)) continue;

      const cells = line.split("|").slice(1, -1).map((c) => c.trim());

      if (!inTable) {
        out.push('<table><thead><tr>');
        cells.forEach((c) => out.push(`<th>${inlineFormat(c)}</th>`));
        out.push("</tr></thead><tbody>");
        inTable = true;
        tableHeaderDone = true;
        continue;
      }
      out.push("<tr>");
      cells.forEach((c) => out.push(`<td>${inlineFormat(c)}</td>`));
      out.push("</tr>");
      continue;
    }

    // Close table if we were in one
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
      tableHeaderDone = false;
    }

    // Headings
    if (line.startsWith("### ")) {
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push("<hr />");
      continue;
    }

    // Checkboxes
    if (line.startsWith("- [ ] ")) {
      out.push(`<div class="check-item"><span class="check-box"></span><span>${inlineFormat(line.slice(6))}</span></div>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)\. (.+)$/);
    if (olMatch) {
      out.push(`<div class="ol-item"><span class="ol-num">${olMatch[1]}.</span><span>${inlineFormat(olMatch[2])}</span></div>`);
      continue;
    }

    // Unordered list
    if (line.startsWith("- ")) {
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      out.push('<div class="spacer"></div>');
      continue;
    }

    // Paragraph
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inTable) out.push("</tbody></table>");

  return out.join("\n");
}

/** Inline formatting: bold, code, links */
function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export default function PRDPage() {
  const docsDir = join(process.cwd(), "docs");
  const summary = readFileSync(join(docsDir, "product-requirements.md"), "utf-8");

  const epicFiles = readdirSync(docsDir)
    .filter((f) => f.startsWith("epic-") && f.endsWith(".md"))
    .sort();

  const epics = epicFiles.map((f) => {
    const content = readFileSync(join(docsDir, f), "utf-8");
    return {
      slug: f.replace(".md", ""),
      title: extractTitle(content),
      content,
    };
  });

  return (
    <div className="prd-layout">
      <style dangerouslySetInnerHTML={{ __html: PRD_CSS }} />

      {/* Sidebar */}
      <aside className="prd-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">NF</div>
          <span className="brand-text">NoPay FreeLunch</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Tổng quan</div>
          <a href="#summary" className="nav-link active">PRD Summary</a>
          <div className="nav-section-label">Epics</div>
          {epics.map((e) => (
            <a key={e.slug} href={`#${e.slug}`} className="nav-link">
              {e.title}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="prd-main">
        <section id="summary">
          <div dangerouslySetInnerHTML={{ __html: mdToHtml(summary) }} />
        </section>

        {epics.map((epic) => (
          <section key={epic.slug} id={epic.slug} className="epic-section">
            <div dangerouslySetInnerHTML={{ __html: mdToHtml(epic.content) }} />
          </section>
        ))}

        <footer className="prd-footer">NoPay FreeLunch PRD v1.1</footer>
      </main>
    </div>
  );
}

const PRD_CSS = `
  .prd-layout {
    display: flex;
    min-height: 100vh;
    background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #09090b;
  }

  /* Sidebar */
  .prd-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid #e4e4e7;
    background: #fafafa;
    overflow-y: auto;
    padding: 16px 0;
  }
  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 20px 20px;
    border-bottom: 1px solid #e4e4e7;
    margin-bottom: 12px;
  }
  .brand-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #3A5CCC;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
  }
  .brand-text {
    font-size: 15px;
    font-weight: 600;
    color: #09090b;
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .nav-section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #a1a1aa;
    padding: 12px 20px 4px;
  }
  .nav-link {
    display: block;
    padding: 6px 20px;
    font-size: 13px;
    font-weight: 450;
    color: #52525b;
    text-decoration: none;
    border-radius: 6px;
    margin: 0 8px;
    transition: all 0.15s;
  }
  .nav-link:hover {
    background: #f0f0f0;
    color: #09090b;
  }
  .nav-link.active {
    background: #eff2ff;
    color: #3A5CCC;
    font-weight: 550;
  }

  /* Main content */
  .prd-main {
    flex: 1;
    max-width: 820px;
    padding: 32px 48px;
    margin: 0 auto;
  }

  .epic-section {
    margin-top: 48px;
    padding-top: 32px;
    border-top: 1px solid #e4e4e7;
  }

  /* Typography */
  .prd-main h1 {
    font-size: 24px;
    font-weight: 650;
    letter-spacing: -0.025em;
    margin-bottom: 8px;
    color: #09090b;
  }
  .prd-main h2 {
    font-size: 17px;
    font-weight: 600;
    margin-top: 28px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e4e4e7;
    color: #09090b;
  }
  .prd-main h3 {
    font-size: 14px;
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 8px;
    color: #09090b;
  }
  .prd-main p {
    margin-bottom: 6px;
    color: #3f3f46;
  }
  .prd-main strong {
    font-weight: 600;
    color: #09090b;
  }
  .prd-main a {
    color: #2563eb;
    text-decoration: none;
  }
  .prd-main a:hover {
    text-decoration: underline;
  }
  .prd-main hr {
    border: none;
    border-top: 1px solid #e4e4e7;
    margin: 24px 0;
  }
  .spacer {
    height: 8px;
  }

  /* Lists */
  .prd-main li {
    padding-left: 16px;
    margin-bottom: 4px;
    position: relative;
    list-style: none;
    font-size: 13px;
    color: #3f3f46;
  }
  .prd-main li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #a1a1aa;
  }
  .ol-item {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 13px;
    color: #3f3f46;
  }
  .ol-num {
    color: #a1a1aa;
    font-weight: 500;
    flex-shrink: 0;
    width: 20px;
  }

  /* Checkboxes */
  .check-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
    margin-left: 4px;
    font-size: 13px;
    color: #3f3f46;
  }
  .check-box {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 1.5px solid #d4d4d8;
    border-radius: 3px;
    flex-shrink: 0;
    margin-top: 3px;
  }

  /* Code */
  .prd-main code {
    background: #f4f4f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12.5px;
    color: #18181b;
  }
  .prd-main pre {
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 12px 0;
  }
  .prd-main pre code {
    background: none;
    padding: 0;
    font-size: 12.5px;
    line-height: 1.5;
  }

  /* Tables */
  .prd-main table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13px;
  }
  .prd-main th {
    background: #f4f4f5;
    font-weight: 600;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #e4e4e7;
    color: #09090b;
  }
  .prd-main td {
    padding: 8px 12px;
    border: 1px solid #e4e4e7;
    color: #3f3f46;
  }
  .prd-main tr:hover td {
    background: #fafafa;
  }

  /* Footer */
  .prd-footer {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid #e4e4e7;
    text-align: center;
    font-size: 12px;
    color: #a1a1aa;
  }

  /* Mobile: hide sidebar, full-width content */
  @media (max-width: 768px) {
    .prd-sidebar {
      display: none;
    }
    .prd-main {
      padding: 20px 16px;
    }
  }
`;
