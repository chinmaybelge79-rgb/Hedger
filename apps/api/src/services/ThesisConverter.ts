export type ExportFormat = 'pdf' | 'docx' | 'excel' | 'sheets' | 'md';

export class ThesisConverter {
  /**
   * Convert Markdown Thesis into an institutional PDF-ready HTML document
   */
  public static toInstitutionalPdfHtml(markdown: string, title: string = 'Investment Thesis'): string {
    let body = markdown;

    // Clean up instructions if present
    body = body.replace(/## PART A — INSTRUCTIONS[\s\S]*?---\n/gi, '');

    // Section wrappers
    body = body.replace(/^(## \d+\..*)$/gim, '</div><div class="thesis-section">$1');

    // Headings
    body = body.replace(/^# (.*$)/gim, '<h1 class="thesis-h1">$1</h1>');
    body = body.replace(/^## (.*$)/gim, '<h2 class="thesis-h2">$1</h2>');
    body = body.replace(/^### (.*$)/gim, '<h3 class="thesis-h3">$1</h3>');
    body = body.replace(/^#### (.*$)/gim, '<h4 class="thesis-h4">$1</h4>');

    // Horizontal rule
    body = body.replace(/^---$/gim, '<hr class="thesis-hr" />');

    // Bold & Italics
    body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    body = body.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks & inline code
    body = body.replace(/```([\s\S]*?)```/g, '<pre class="thesis-code-block"><code>$1</code></pre>');
    body = body.replace(/`([^`]+)`/g, '<code class="thesis-code">$1</code>');

    // Blockquotes
    body = body.replace(/^> (.*$)/gim, '<blockquote class="thesis-quote">$1</blockquote>');

    // Highlight tags like [R], [C], [F], [A], [E]
    body = body.replace(/\[R\]/g, '<span class="tag-r">[R]</span>');
    body = body.replace(/\[C\]/g, '<span class="tag-c">[C]</span>');
    body = body.replace(/\[F\]/g, '<span class="tag-f">[F]</span>');
    body = body.replace(/\[A\]/g, '<span class="tag-a">[A]</span>');
    body = body.replace(/\[E\]/g, '<span class="tag-e">[E]</span>');

    // Markdown Tables to HTML Tables
    body = this.convertMarkdownTables(body);

    // Lists
    body = body.replace(/^\s*-\s+(.*$)/gim, '<li class="thesis-li">$1</li>');
    body = body.replace(/(<li class="thesis-li">.*<\/li>\s*)+/g, '<ul class="thesis-ul">$&</ul>');

    // Paragraphs
    body = body
      .split('\n\n')
      .map((block) => {
        const trimmed = block.trim();
        if (
          trimmed.startsWith('<h1') ||
          trimmed.startsWith('<h2') ||
          trimmed.startsWith('<h3') ||
          trimmed.startsWith('<h4') ||
          trimmed.startsWith('<table') ||
          trimmed.startsWith('<hr') ||
          trimmed.startsWith('<ul') ||
          trimmed.startsWith('<blockquote') ||
          trimmed.startsWith('<pre') ||
          trimmed.startsWith('</div>') ||
          trimmed.startsWith('<div')
        ) {
          return block;
        }
        return `<p class="thesis-p">${trimmed.replace(/\n/g, '<br />')}</p>`;
      })
      .join('\n\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 14mm 18mm 14mm;
      @bottom-right {
        content: "Page " counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-left {
        content: "HEDGER RESEARCH · INSTITUTIONAL INVESTMENT THESIS";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        background: #ffffff !important;
        color: #0f172a !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
      table, .thesis-section {
        page-break-inside: avoid;
      }
      .thesis-h1, .thesis-h2, .thesis-h3 {
        page-break-after: avoid;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.55;
      color: #0f172a;
      background-color: #ffffff;
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 24px;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }

    .thesis-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 28px;
    }

    .thesis-logo-mark {
      font-weight: 800;
      font-size: 20px;
      letter-spacing: -0.03em;
      color: #0f172a;
    }

    .thesis-subtitle {
      font-size: 11px;
      color: #64748b;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 500;
      margin-top: 2px;
    }

    .thesis-badge-pill {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      background-color: #f8fafc;
      color: #334155;
    }

    .tag-legend {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      color: #475569;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .tag-r, .tag-c, .tag-f, .tag-a, .tag-e {
      font-weight: 600;
      font-size: 10.5px;
      padding: 1px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
    .tag-r { background: #e0f2fe; color: #0369a1; }
    .tag-c { background: #f1f5f9; color: #334155; }
    .tag-f { background: #fef3c7; color: #92400e; }
    .tag-a { background: #ede9fe; color: #5b21b6; }
    .tag-e { background: #ecfdf5; color: #047857; }

    .thesis-h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin: 16px 0 12px 0;
      color: #0f172a;
    }

    .thesis-h2 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 28px 0 10px 0;
      color: #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 4px;
      text-transform: uppercase;
    }

    .thesis-h3 {
      font-size: 13.5px;
      font-weight: 600;
      margin: 16px 0 6px 0;
      color: #1e293b;
    }

    .thesis-p {
      font-size: 12.5px;
      color: #334155;
      margin: 0 0 10px 0;
      line-height: 1.6;
    }

    .thesis-hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }

    .thesis-ul {
      margin: 0 0 12px 18px;
      padding: 0;
    }

    .thesis-li {
      font-size: 12.5px;
      color: #334155;
      margin-bottom: 4px;
      line-height: 1.5;
    }

    .thesis-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 20px 0;
      font-size: 11px;
    }

    .thesis-table th {
      background-color: #f8fafc;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      font-size: 11px;
    }

    .thesis-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    .thesis-table tr:nth-child(even) {
      background-color: #fcfcfc;
    }

    .thesis-quote {
      border-left: 3px solid #0f172a;
      padding: 8px 14px;
      margin: 12px 0;
      background-color: #f8fafc;
      color: #334155;
      font-size: 12px;
      line-height: 1.5;
    }

    .thesis-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 3px;
      color: #0f172a;
    }

    .thesis-code-block {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 10px;
      overflow-x: auto;
      font-size: 11px;
      margin: 12px 0;
    }

    .thesis-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="thesis-header-bar">
    <div>
      <div class="thesis-logo-mark">HEDGER</div>
      <div class="thesis-subtitle">Institutional Equity Research · Fundamental Investment Thesis</div>
    </div>
    <div class="thesis-badge-pill">Confidential & Institutional</div>
  </div>

  <div class="tag-legend">
    <span><strong>Data Legend:</strong></span>
    <span><span class="tag-r">[R]</span> Reported (filings)</span>
    <span><span class="tag-c">[C]</span> Calculated</span>
    <span><span class="tag-f">[F]</span> Model forecast</span>
    <span><span class="tag-a">[A]</span> Qualitative assessment</span>
    <span><span class="tag-e">[E]</span> External consensus</span>
  </div>

  <div>
    ${body}
  </div>

  <div class="thesis-footer">
    <div>Generated via Hedger Institutional Research Engine · Source-Validated Fundamentals</div>
    <div>For Research and Educational Purposes Only · Not Investment Advice</div>
  </div>

  <script>
    if (window.location.search.includes('print=true')) {
      window.onload = function() {
        window.print();
      };
    }
  </script>
</body>
</html>`;
  }

  /**
   * Alias for backward compatibility
   */
  public static toHtml(markdown: string, title: string = 'Investment Thesis'): string {
    return this.toInstitutionalPdfHtml(markdown, title);
  }

  /**
   * Convert Markdown Tables into HTML Tables
   */
  private static convertMarkdownTables(markdown: string): string {
    const tableRegex = /((?:\|[^\n]+\|\r?\n)+)/g;

    return markdown.replace(tableRegex, (match) => {
      const lines = match.trim().split('\n');
      if (lines.length < 2) return match;

      let html = '<table class="thesis-table">\n';
      let isHeader = true;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;

        // Skip divider line (e.g. |---|---|)
        if (line.match(/^\|(?:\s*:?-+:?\s*\|)+$/)) {
          isHeader = false;
          continue;
        }

        const cells = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        html += '  <tr>\n';
        for (const cell of cells) {
          if (isHeader) {
            html += `    <th>${cell}</th>\n`;
          } else {
            html += `    <td>${cell}</td>\n`;
          }
        }
        html += '  </tr>\n';
      }

      html += '</table>\n';
      return html;
    });
  }

  /**
   * Convert Markdown to Word-compatible XML / HTML-DOCX
   */
  public static toDocxHtml(markdown: string, title: string = 'Investment Thesis'): string {
    const fullHtml = this.toInstitutionalPdfHtml(markdown, title);

    return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; color: #111111; line-height: 1.4; }
h1 { font-size: 18pt; font-weight: bold; color: #000000; border-bottom: 1.5pt solid #000000; padding-bottom: 4pt; }
h2 { font-size: 13pt; font-weight: bold; color: #000000; border-bottom: 1pt solid #cccccc; margin-top: 14pt; }
h3 { font-size: 11pt; font-weight: bold; color: #333333; margin-top: 10pt; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9pt; }
th { background-color: #f2f2f2; border: 0.75pt solid #cccccc; padding: 4pt 6pt; text-align: left; }
td { border: 0.75pt solid #cccccc; padding: 4pt 6pt; }
p { margin: 4pt 0; }
</style>
</head>
<body>
${fullHtml}
</body>
</html>`;
  }

  /**
   * Convert Markdown Thesis into Structured Excel CSV format
   * Extracts every table and section with clear section banners for financial modeling
   */
  public static toExcelCsv(markdown: string, title: string = 'Investment Thesis'): string {
    const lines = markdown.split('\n');
    const csvRows: string[] = [];

    // Header banner
    csvRows.push(`"HEDGER RESEARCH — INSTITUTIONAL EQUITY INVESTMENT THESIS"`);
    csvRows.push(`"${title.replace(/"/g, '""')}"`);
    csvRows.push(`"Generated Date:","${new Date().toISOString().split('T')[0]}"`);
    csvRows.push(`"Methodology:","Source-Validated Fundamentals, DCF Multi-Stage FCFF, Reverse DCF, Scenario Valuation"`);
    csvRows.push('');

    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';

      if (!line) {
        if (inTable) {
          csvRows.push('');
          inTable = false;
        }
        continue;
      }

      // Check for Section headers
      if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
        const headerText = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        csvRows.push('');
        csvRows.push(`"=== ${headerText.replace(/"/g, '""')} ==="`);
        csvRows.push('');
        continue;
      }

      // Check for table lines
      if (line.startsWith('|') && line.endsWith('|')) {
        // Skip table separator line (|---|---|)
        if (line.match(/^\|(?:\s*:?-+:?\s*\|)+$/)) {
          continue;
        }

        inTable = true;
        const cells = line
          .split('|')
          .slice(1, -1)
          .map((c) => {
            const clean = c.trim().replace(/"/g, '""');
            return `"${clean}"`;
          });

        csvRows.push(cells.join(','));
        continue;
      }

      // Plain text or bullet point
      if (line.startsWith('- ')) {
        const bulletText = line.replace(/^- \s*/, '').replace(/"/g, '""');
        csvRows.push(`"•","${bulletText}"`);
      } else if (line.startsWith('> ')) {
        const quoteText = line.replace(/^> \s*/, '').replace(/"/g, '""');
        csvRows.push(`"NOTE:","${quoteText}"`);
      }
    }

    csvRows.push('');
    csvRows.push(`"DISCLAIMER:","This document is for educational and research purposes only. Not investment advice."`);

    return csvRows.join('\r\n');
  }

  /**
   * Convert Markdown Thesis into Google Sheets CSV format
   */
  public static toSheetsCsv(markdown: string, title: string = 'Investment Thesis'): string {
    // Uses the same structured tabular formatting compliant with RFC 4180
    return this.toExcelCsv(markdown, title);
  }
}
