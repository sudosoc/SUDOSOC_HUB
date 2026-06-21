'use strict';
(function() {

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ──────────────────────────────────────────────
// JSON FORMATTER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'json-formatter',
  name: 'JSON Formatter',
  category: 'data',
  description: 'Pretty-print and format JSON with syntax highlighting and collapsible nodes.',
  tags: ['json','format','pretty','print','beautify','indent','formatter'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="jfInput">JSON Input</label>
        <textarea class="tool-textarea" id="jfInput" placeholder='{"name":"Alice","roles":["admin","user"],"active":true}' spellcheck="false" style="min-height:180px"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="jfFormat">Format</button>
        <button class="btn btn-secondary" id="jfMinify">Minify</button>
        <button class="btn btn-ghost btn-icon" id="jfCopy" title="Copy output">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" id="jfClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
        <select class="tool-select" id="jfIndent" style="width:auto;height:36px;padding:0 24px 0 8px">
          <option value="2">2 spaces</option>
          <option value="4" selected>4 spaces</option>
          <option value="t">Tabs</option>
        </select>
      </div>
      <div class="tool-status" id="jfStatus">
        <span class="tool-status-dot" id="jfDot"></span>
        <span id="jfMsg" class="tool-status-msg">Ready</span>
      </div>
      <div id="jfOutput" class="code-block" style="margin-top:var(--sp-4);display:none">
        <div class="code-block-header">
          <span class="code-block-lang">JSON</span>
          <button class="btn btn-ghost btn-sm" id="jfCopy2">Copy</button>
        </div>
        <pre id="jfPre" style="max-height:500px;overflow:auto"></pre>
      </div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('jfInput');
    const output = document.getElementById('jfOutput');
    const pre    = document.getElementById('jfPre');
    const dot    = document.getElementById('jfDot');
    const msg    = document.getElementById('jfMsg');
    const indent = document.getElementById('jfIndent');
    let lastJson = '';

    function setStatus(ok, text) {
      dot.className = 'tool-status-dot ' + (ok ? 'ok' : 'error');
      msg.textContent = text;
    }

    function colorize(json) {
      return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        match => {
          let cls = 'color:var(--info)';
          if (/^"/.test(match)) cls = /:$/.test(match) ? 'color:var(--text-2)' : 'color:var(--success)';
          else if (/true|false/.test(match)) cls = 'color:var(--warning)';
          else if (/null/.test(match)) cls = 'color:var(--error)';
          return `<span style="${cls}">${esc(match)}</span>`;
        }
      );
    }

    function format() {
      try {
        const parsed = JSON.parse(input.value.trim());
        const ind = indent.value === 't' ? '\t' : parseInt(indent.value);
        lastJson = JSON.stringify(parsed, null, ind);
        const lines = lastJson.split('\n').length;
        const size  = new Blob([lastJson]).size;
        pre.innerHTML = colorize(lastJson);
        output.style.display = 'block';
        setStatus(true, `Valid JSON · ${lines} lines · ${size} bytes`);
      } catch(e) {
        output.style.display = 'none';
        setStatus(false, 'Invalid JSON: ' + e.message);
      }
    }

    function minify() {
      try {
        const parsed = JSON.parse(input.value.trim());
        lastJson = JSON.stringify(parsed);
        pre.textContent = lastJson;
        output.style.display = 'block';
        setStatus(true, `Minified · ${lastJson.length} chars`);
      } catch(e) {
        setStatus(false, 'Invalid JSON: ' + e.message);
      }
    }

    document.getElementById('jfFormat').addEventListener('click', format);
    document.getElementById('jfMinify').addEventListener('click', minify);
    [document.getElementById('jfCopy'), document.getElementById('jfCopy2')].forEach(btn => {
      btn?.addEventListener('click', () => {
        if (lastJson) navigator.clipboard.writeText(lastJson).then(() => Toast.success('Copied'));
      });
    });
    document.getElementById('jfClear').addEventListener('click', () => {
      input.value=''; output.style.display='none';
      dot.className='tool-status-dot'; msg.textContent='Ready';
    });
  }
});

// ──────────────────────────────────────────────
// JSON VALIDATOR
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'json-validator',
  name: 'JSON Validator',
  category: 'data',
  description: 'Validate JSON syntax and display a human-readable error with line/column info.',
  tags: ['json','validate','validator','syntax','check','error','lint'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="jvInput">JSON to Validate</label>
        <textarea class="tool-textarea" id="jvInput" placeholder="Paste JSON here..." spellcheck="false" style="min-height:200px"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="jvValidate">Validate</button>
        <button class="btn btn-ghost btn-icon" id="jvClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div id="jvResult" style="margin-top:var(--sp-4)"></div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('jvInput');
    const result = document.getElementById('jvResult');

    function validate() {
      const text = input.value.trim();
      if (!text) { result.innerHTML=''; return; }
      try {
        const parsed = JSON.parse(text);
        const type = Array.isArray(parsed) ? 'array' : typeof parsed;
        const keys = type === 'object' ? Object.keys(parsed).length : null;
        result.innerHTML = `<div class="info-box success">
          <span class="info-box-icon">✓</span>
          <div>
            Valid JSON<br>
            <span style="font-size:12px;opacity:.8">Type: ${type}${keys !== null ? ` · ${keys} top-level keys` : ''} · ${text.length} chars</span>
          </div>
        </div>`;
      } catch(e) {
        const match = e.message.match(/position (\d+)/);
        let errInfo = '';
        if (match) {
          const pos = parseInt(match[1]);
          const lines = text.slice(0, pos).split('\n');
          const line = lines.length;
          const col  = lines[lines.length - 1].length + 1;
          errInfo = ` at line ${line}, column ${col}`;
        }
        result.innerHTML = `<div class="info-box error">
          <span class="info-box-icon">✕</span>
          <div>Invalid JSON${errInfo}<br><span style="font-size:12px;opacity:.8">${esc(e.message)}</span></div>
        </div>`;
      }
    }

    document.getElementById('jvValidate').addEventListener('click', validate);
    document.getElementById('jvClear').addEventListener('click', () => { input.value=''; result.innerHTML=''; });
    input.addEventListener('input', () => { if (input.value.trim().length > 2) validate(); });
  }
});

// ──────────────────────────────────────────────
// JSON MINIFIER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'json-minifier',
  name: 'JSON Minifier',
  category: 'data',
  description: 'Strip whitespace from JSON to reduce size. Shows compression ratio.',
  tags: ['json','minify','minifier','compress','strip','whitespace','size'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="jmInput">JSON Input</label>
        <textarea class="tool-textarea" id="jmInput" placeholder="Paste formatted JSON..." spellcheck="false" style="min-height:160px"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="jmMinify">Minify</button>
        <button class="btn btn-ghost btn-icon" id="jmCopy" title="Copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" id="jmClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div class="tool-status" id="jmStatus">
        <span class="tool-status-dot" id="jmDot"></span>
        <span id="jmMsg" class="tool-status-msg">Ready</span>
      </div>
      <div class="tool-field" style="margin-top:var(--sp-4)">
        <label class="tool-label">Minified Output</label>
        <textarea class="tool-textarea output" id="jmOutput" readonly spellcheck="false"></textarea>
      </div>
    </div>`;
  },
  init() {
    const input = document.getElementById('jmInput');
    const output = document.getElementById('jmOutput');
    const dot = document.getElementById('jmDot'); const msg = document.getElementById('jmMsg');

    document.getElementById('jmMinify').addEventListener('click', () => {
      try {
        const parsed = JSON.parse(input.value.trim());
        const minified = JSON.stringify(parsed);
        output.value = minified;
        const saved = ((1 - minified.length / input.value.length) * 100).toFixed(1);
        dot.className = 'tool-status-dot ok';
        msg.textContent = `${input.value.length} → ${minified.length} bytes · Saved ${saved}%`;
      } catch(e) {
        dot.className = 'tool-status-dot error'; msg.textContent = 'Invalid JSON: ' + e.message;
      }
    });
    document.getElementById('jmCopy').addEventListener('click', () => {
      if (output.value) navigator.clipboard.writeText(output.value).then(() => Toast.success('Copied'));
    });
    document.getElementById('jmClear').addEventListener('click', () => {
      input.value=''; output.value=''; dot.className='tool-status-dot'; msg.textContent='Ready';
    });
  }
});

// ──────────────────────────────────────────────
// XML FORMATTER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'xml-formatter',
  name: 'XML Formatter',
  category: 'data',
  description: 'Prettify and validate XML documents with proper indentation.',
  tags: ['xml','format','pretty','indent','beautify','html','markup'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="xmlInput">XML Input</label>
        <textarea class="tool-textarea" id="xmlInput" placeholder="<root><child>value</child></root>" spellcheck="false" style="min-height:160px"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="xmlFormat">Format</button>
        <button class="btn btn-ghost btn-icon" id="xmlCopy" title="Copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" id="xmlClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div class="tool-status" id="xmlStatus">
        <span class="tool-status-dot" id="xmlDot"></span>
        <span id="xmlMsg" class="tool-status-msg">Ready</span>
      </div>
      <div class="code-block" style="margin-top:var(--sp-4);display:none" id="xmlOut">
        <div class="code-block-header"><span class="code-block-lang">XML</span></div>
        <pre id="xmlPre" style="max-height:480px;overflow:auto"></pre>
      </div>
    </div>`;
  },
  init() {
    const input = document.getElementById('xmlInput');
    const out   = document.getElementById('xmlOut');
    const pre   = document.getElementById('xmlPre');
    const dot   = document.getElementById('xmlDot');
    const msg   = document.getElementById('xmlMsg');
    let lastXml = '';

    function formatXML(xml) {
      let formatted = '';
      let indent = 0;
      const tab = '  ';
      xml.replace(/>\s*</g, '>\n<').split('\n').forEach(node => {
        node = node.trim();
        if (!node) return;
        if (node.match(/^<\/\w/)) indent--;
        formatted += tab.repeat(Math.max(0, indent)) + node + '\n';
        if (node.match(/^<\w[^>]*[^/]>.*$/) && !node.match(/^<.+\/.+>/) && !node.includes('</')) indent++;
      });
      return formatted.trim();
    }

    document.getElementById('xmlFormat').addEventListener('click', () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input.value, 'application/xml');
      const err = doc.querySelector('parsererror');
      if (err) {
        dot.className='tool-status-dot error';
        msg.textContent = 'XML Error: ' + err.textContent.slice(0,120);
        out.style.display = 'none'; return;
      }
      lastXml = formatXML(input.value);
      pre.textContent = lastXml;
      out.style.display = 'block';
      dot.className='tool-status-dot ok';
      msg.textContent = `Valid XML · ${lastXml.split('\n').length} lines`;
    });

    document.getElementById('xmlCopy').addEventListener('click', () => {
      if (lastXml) navigator.clipboard.writeText(lastXml).then(() => Toast.success('Copied'));
    });
    document.getElementById('xmlClear').addEventListener('click', () => {
      input.value=''; out.style.display='none'; dot.className='tool-status-dot'; msg.textContent='Ready';
    });
  }
});

// ──────────────────────────────────────────────
// YAML VIEWER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'yaml-viewer',
  name: 'YAML Viewer',
  category: 'data',
  description: 'Display and syntax-highlight YAML configuration files. Identifies structure and converts to JSON.',
  tags: ['yaml','yml','viewer','config','convert','json','docker','kubernetes'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="yamlInput">YAML Input</label>
        <textarea class="tool-textarea" id="yamlInput" placeholder="name: Alice\nroles:\n  - admin\n  - user\nactive: true\n" spellcheck="false" style="min-height:200px"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="yamlView">View</button>
        <button class="btn btn-secondary" id="yamlToJson">Convert to JSON</button>
        <button class="btn btn-ghost btn-icon" id="yamlClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div class="code-block" id="yamlOut" style="margin-top:var(--sp-4);display:none">
        <div class="code-block-header"><span class="code-block-lang" id="yamlLang">YAML</span></div>
        <pre id="yamlPre" style="max-height:480px;overflow:auto"></pre>
      </div>
    </div>`;
  },
  init() {
    const input = document.getElementById('yamlInput');
    const out   = document.getElementById('yamlOut');
    const pre   = document.getElementById('yamlPre');
    const lang  = document.getElementById('yamlLang');

    function syntaxHighlightYAML(text) {
      return text.split('\n').map(line => {
        const escapedLine = esc(line);
        return escapedLine
          .replace(/^(\s*)(#.*)$/, '$1<span style="color:var(--text-3)">$2</span>')
          .replace(/^(\s*)([\w-]+)(\s*:)/, '$1<span style="color:var(--text-2)">$2</span>$3')
          .replace(/(:\s*)(\d+\.?\d*)(,|\s|$)/g, '$1<span style="color:var(--info)">$2</span>$3')
          .replace(/(:\s*)(true|false|null|~)(,|\s|$)/gi, '$1<span style="color:var(--warning)">$2</span>$3')
          .replace(/(:\s*)"([^"]*)"/g, '$1<span style="color:var(--success)">"$2"</span>')
          .replace(/(:\s*)\'([^\']*)\'/g, '$1<span style="color:var(--success)">\'$2\'</span>');
      }).join('\n');
    }

    // Minimal YAML-to-object parser for simple structures
    function parseSimpleYAML(text) {
      const lines = text.split('\n');
      const result = {};
      const stack = [{ obj: result, indent: -1 }];
      let currentArray = null, currentKey = null;

      lines.forEach(line => {
        if (!line.trim() || line.trim().startsWith('#')) return;
        const indent = line.match(/^(\s*)/)[1].length;
        const content = line.trim();

        if (content.startsWith('- ')) {
          const val = content.slice(2).trim();
          const parent = stack[stack.length-1].obj;
          if (!Array.isArray(parent[currentKey])) parent[currentKey] = [];
          const parsed = /^\d+$/.test(val) ? parseInt(val) : val === 'true' ? true : val === 'false' ? false : val === 'null' ? null : val;
          parent[currentKey].push(parsed);
          return;
        }

        const colonIdx = content.indexOf(':');
        if (colonIdx === -1) return;
        const key = content.slice(0, colonIdx).trim();
        const value = content.slice(colonIdx + 1).trim();
        currentKey = key;

        while (stack.length > 1 && stack[stack.length-1].indent >= indent) stack.pop();
        const parent = stack[stack.length-1].obj;

        if (!value) {
          parent[key] = {};
          stack.push({ obj: parent[key], indent });
        } else {
          const v = /^\d+$/.test(value) ? parseInt(value)
            : /^\d+\.\d+$/.test(value) ? parseFloat(value)
            : value === 'true' ? true : value === 'false' ? false : value === 'null' ? null
            : value.replace(/^["']|["']$/g, '');
          parent[key] = v;
        }
      });
      return result;
    }

    document.getElementById('yamlView').addEventListener('click', () => {
      if (!input.value.trim()) return;
      pre.innerHTML = syntaxHighlightYAML(input.value);
      lang.textContent = 'YAML';
      out.style.display = 'block';
    });

    document.getElementById('yamlToJson').addEventListener('click', () => {
      try {
        const obj = parseSimpleYAML(input.value);
        pre.textContent = JSON.stringify(obj, null, 2);
        lang.textContent = 'JSON (converted)';
        out.style.display = 'block';
        Toast.success('Converted to JSON (simple structures)');
      } catch(e) { Toast.error('Parse error: ' + e.message); }
    });

    document.getElementById('yamlClear').addEventListener('click', () => { input.value=''; out.style.display='none'; });
  }
});

})();
