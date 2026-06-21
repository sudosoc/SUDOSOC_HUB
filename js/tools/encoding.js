'use strict';
(function() {

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ──────────────────────────────────────────────
// BASE64
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'base64',
  name: 'Base64 Encoder/Decoder',
  category: 'encoding',
  description: 'Encode text or binary data to Base64, and decode Base64 strings back to plain text.',
  tags: ['base64','encode','decode','b64','encoding','decoding'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="b64Input">Input</label>
        <textarea class="tool-textarea" id="b64Input" placeholder="Enter text to encode, or Base64 to decode..." spellcheck="false"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="b64Encode">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Encode
        </button>
        <button class="btn btn-secondary" id="b64Decode">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 18 2 12 8 6"/><polyline points="16 6 22 12 16 18"/></svg>
          Decode
        </button>
        <button class="btn btn-ghost btn-icon" id="b64Copy" title="Copy output">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" id="b64Clear" title="Clear all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
      <div class="tool-field">
        <label class="tool-label" for="b64Output">
          Output
          <span class="tool-label-badge" id="b64Mode">—</span>
        </label>
        <textarea class="tool-textarea output" id="b64Output" readonly spellcheck="false"></textarea>
      </div>
      <div class="tool-status" id="b64Status">
        <span class="tool-status-dot" id="b64Dot"></span>
        <span class="tool-status-msg" id="b64Msg">Ready</span>
      </div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('b64Input');
    const output = document.getElementById('b64Output');
    const dot    = document.getElementById('b64Dot');
    const msg    = document.getElementById('b64Msg');
    const modeEl = document.getElementById('b64Mode');

    function setStatus(ok, text) {
      dot.className = 'tool-status-dot ' + (ok ? 'ok' : 'error');
      msg.textContent = text;
    }

    function encode() {
      try {
        const val = input.value;
        if (!val) { output.value = ''; setStatus(false, 'No input'); return; }
        const bytes = new TextEncoder().encode(val);
        let bin = '';
        bytes.forEach(b => bin += String.fromCharCode(b));
        output.value = btoa(bin);
        modeEl.textContent = 'encoded';
        setStatus(true, `Encoded ${val.length} chars → ${output.value.length} chars`);
      } catch(e) { output.value = ''; setStatus(false, 'Encode failed: ' + e.message); }
    }

    function decode() {
      try {
        const val = input.value.trim();
        if (!val) { output.value = ''; setStatus(false, 'No input'); return; }
        const bin  = atob(val);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        output.value = new TextDecoder().decode(bytes);
        modeEl.textContent = 'decoded';
        setStatus(true, `Decoded ${val.length} chars → ${output.value.length} chars`);
      } catch(e) { output.value = ''; setStatus(false, 'Invalid Base64: ' + e.message); }
    }

    document.getElementById('b64Encode').addEventListener('click', encode);
    document.getElementById('b64Decode').addEventListener('click', decode);
    document.getElementById('b64Clear').addEventListener('click', () => {
      input.value = ''; output.value = '';
      dot.className = 'tool-status-dot'; msg.textContent = 'Ready';
      modeEl.textContent = '—';
    });
    document.getElementById('b64Copy').addEventListener('click', () => {
      if (!output.value) return;
      navigator.clipboard.writeText(output.value).then(() => Toast.success('Copied to clipboard'));
    });

    // Auto-detect on paste
    input.addEventListener('paste', () => setTimeout(() => {
      const v = input.value.trim();
      if (/^[A-Za-z0-9+/=\s]+$/.test(v) && v.length % 4 < 2) decode();
      else encode();
    }, 50));
  }
});

// ──────────────────────────────────────────────
// URL ENCODE/DECODE
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'url-encode',
  name: 'URL Encoder/Decoder',
  category: 'encoding',
  description: 'Encode or decode URL components using percent-encoding.',
  tags: ['url','encode','decode','percent','uri','urlencode','urldecode'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="urlInput">Input</label>
        <textarea class="tool-textarea" id="urlInput" placeholder="https://example.com/search?q=hello world&lang=ar" spellcheck="false"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="urlEncode">Encode</button>
        <button class="btn btn-secondary" id="urlDecode">Decode</button>
        <button class="btn btn-ghost btn-icon" id="urlCopy" title="Copy output">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" id="urlClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div class="tool-field">
        <label class="tool-label" for="urlOutput">Output</label>
        <textarea class="tool-textarea output" id="urlOutput" readonly spellcheck="false"></textarea>
      </div>
    </div>`;
  },
  init() {
    const input = document.getElementById('urlInput');
    const output = document.getElementById('urlOutput');
    document.getElementById('urlEncode').addEventListener('click', () => {
      try { output.value = encodeURIComponent(input.value); }
      catch(e) { Toast.error('Encode failed: ' + e.message); }
    });
    document.getElementById('urlDecode').addEventListener('click', () => {
      try { output.value = decodeURIComponent(input.value); }
      catch(e) { Toast.error('Invalid URL encoding: ' + e.message); }
    });
    document.getElementById('urlCopy').addEventListener('click', () => {
      navigator.clipboard.writeText(output.value).then(() => Toast.success('Copied'));
    });
    document.getElementById('urlClear').addEventListener('click', () => {
      input.value = ''; output.value = '';
    });
  }
});

// ──────────────────────────────────────────────
// HTML ENCODE/DECODE
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'html-encode',
  name: 'HTML Encoder/Decoder',
  category: 'encoding',
  description: 'Convert special characters to HTML entities and vice versa. Useful for preventing XSS.',
  tags: ['html','encode','decode','entities','xss','escape','htmlencode'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="htmlInput">Input</label>
        <textarea class="tool-textarea" id="htmlInput" placeholder="<script>alert('xss')</script>" spellcheck="false"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="htmlEncode">Encode</button>
        <button class="btn btn-secondary" id="htmlDecode">Decode</button>
        <button class="btn btn-ghost btn-icon" id="htmlCopy" title="Copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" id="htmlClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div class="tool-field">
        <label class="tool-label" for="htmlOutput">Output</label>
        <textarea class="tool-textarea output" id="htmlOutput" readonly spellcheck="false"></textarea>
      </div>
    </div>`;
  },
  init() {
    const input = document.getElementById('htmlInput');
    const output = document.getElementById('htmlOutput');

    function encode(str) {
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;');
    }
    function decode(str) {
      const el = document.createElement('textarea');
      el.innerHTML = str;
      return el.value;
    }

    document.getElementById('htmlEncode').addEventListener('click', () => { output.value = encode(input.value); });
    document.getElementById('htmlDecode').addEventListener('click', () => { output.value = decode(input.value); });
    document.getElementById('htmlCopy').addEventListener('click', () => {
      navigator.clipboard.writeText(output.value).then(() => Toast.success('Copied'));
    });
    document.getElementById('htmlClear').addEventListener('click', () => { input.value=''; output.value=''; });
  }
});

// ──────────────────────────────────────────────
// JWT DECODER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'jwt',
  name: 'JWT Decoder',
  category: 'encoding',
  description: 'Decode and inspect JSON Web Tokens (JWT). Does NOT verify signatures.',
  tags: ['jwt','json web token','token','bearer','decode','header','payload','signature'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="jwtInput">JWT Token <span class="tool-label-badge">paste token</span></label>
        <textarea class="tool-textarea" id="jwtInput" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." rows="4" spellcheck="false"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="jwtDecode">Decode</button>
        <button class="btn btn-ghost btn-icon" id="jwtClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div id="jwtResult"></div>
    </div>`;
  },
  init() {
    const input = document.getElementById('jwtInput');
    const result = document.getElementById('jwtResult');

    function b64urlDecode(str) {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      try {
        const bin = atob(str);
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      } catch { return null; }
    }

    function decode() {
      const token = input.value.trim();
      if (!token) { result.innerHTML = ''; return; }
      const parts = token.split('.');
      if (parts.length !== 3) {
        result.innerHTML = `<div class="info-box error"><span class="info-box-icon">✕</span>Not a valid JWT — expected 3 parts separated by dots, got ${parts.length}</div>`;
        return;
      }
      const headerRaw  = b64urlDecode(parts[0]);
      const payloadRaw = b64urlDecode(parts[1]);
      if (!headerRaw || !payloadRaw) {
        result.innerHTML = `<div class="info-box error"><span class="info-box-icon">✕</span>Failed to decode JWT — invalid Base64URL encoding</div>`;
        return;
      }
      let header, payload;
      try { header  = JSON.parse(headerRaw); }  catch { header  = { raw: headerRaw }; }
      try { payload = JSON.parse(payloadRaw); } catch { payload = { raw: payloadRaw }; }

      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;
      const expStatus = exp
        ? (exp < now
          ? `<span class="tag tag-error">EXPIRED ${new Date(exp*1000).toUTCString()}</span>`
          : `<span class="tag tag-success">VALID until ${new Date(exp*1000).toUTCString()}</span>`)
        : `<span class="tag tag-default">No expiry</span>`;

      result.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:var(--sp-4);margin-top:var(--sp-4)">
          <div class="info-box info">
            <span class="info-box-icon">ℹ</span>
            Signature is NOT verified. This is a decode-only tool.
          </div>
          <div class="code-block">
            <div class="code-block-header">
              <span class="code-block-lang">Header · Algorithm: ${esc(header.alg||'?')} · Type: ${esc(header.typ||'?')}</span>
            </div>
            <pre>${esc(JSON.stringify(header, null, 2))}</pre>
          </div>
          <div class="code-block">
            <div class="code-block-header">
              <span class="code-block-lang">Payload</span>
              <span>${expStatus}</span>
            </div>
            <pre>${esc(JSON.stringify(payload, null, 2))}</pre>
          </div>
          <div class="code-block">
            <div class="code-block-header"><span class="code-block-lang">Signature (raw Base64URL)</span></div>
            <pre style="color:var(--text-3);word-break:break-all">${esc(parts[2])}</pre>
          </div>
        </div>`;
    }

    document.getElementById('jwtDecode').addEventListener('click', decode);
    document.getElementById('jwtClear').addEventListener('click', () => { input.value=''; result.innerHTML=''; });
    input.addEventListener('input', () => { if (input.value.trim()) decode(); else result.innerHTML=''; });
  }
});

// ──────────────────────────────────────────────
// UNICODE CONVERTER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'unicode',
  name: 'Unicode Converter',
  category: 'encoding',
  description: 'Convert text to Unicode code points (U+XXXX) and escape sequences, and back.',
  tags: ['unicode','codepoint','utf','escape','u+','character','encoding'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="uniInput">Text Input</label>
        <input type="text" class="tool-input" id="uniInput" placeholder="Hello → U+0048 U+0065 U+006C ...">
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="uniToCode">Text → Unicode</button>
        <button class="btn btn-secondary" id="uniFromCode">Unicode → Text</button>
        <button class="btn btn-ghost btn-icon" id="uniClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div class="tool-field">
        <label class="tool-label" for="uniOutput">Unicode Code Points</label>
        <input type="text" class="tool-input" id="uniOutput" readonly>
      </div>
      <div class="tool-field">
        <label class="tool-label">JS Escape Sequence</label>
        <input type="text" class="tool-input" id="uniJs" readonly>
      </div>
      <div class="tool-field">
        <label class="tool-label">CSS Escape</label>
        <input type="text" class="tool-input" id="uniCss" readonly>
      </div>
      <div id="uniTable" style="margin-top:var(--sp-4)"></div>
    </div>`;
  },
  init() {
    const input   = document.getElementById('uniInput');
    const output  = document.getElementById('uniOutput');
    const jsOut   = document.getElementById('uniJs');
    const cssOut  = document.getElementById('uniCss');
    const table   = document.getElementById('uniTable');

    function textToUni() {
      const str = input.value;
      if (!str) return;
      const points = [...str].map(c => {
        const cp = c.codePointAt(0);
        return `U+${cp.toString(16).toUpperCase().padStart(4,'0')}`;
      });
      output.value = points.join(' ');
      jsOut.value  = [...str].map(c => `\\u${c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}`).join('');
      cssOut.value = [...str].map(c => `\\${c.codePointAt(0).toString(16).toUpperCase()}`).join(' ');

      const rows = [...str].map(c => {
        const cp = c.codePointAt(0);
        const hex = cp.toString(16).toUpperCase().padStart(4,'0');
        return `<tr>
          <td>${esc(c)}</td>
          <td>U+${esc(hex)}</td>
          <td>${cp}</td>
          <td>\\u${esc(hex)}</td>
          <td>${c.charCodeAt(0)}</td>
        </tr>`;
      }).join('');

      table.innerHTML = `<div class="table-wrap"><table class="tool-table">
        <thead><tr><th>Char</th><th>Code Point</th><th>Decimal</th><th>JS Escape</th><th>UTF-16</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
    }

    function uniToText() {
      const str = input.value;
      try {
        const result = str
          .replace(/U\+([0-9A-Fa-f]{4,6})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
          .replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
        output.value = result;
        table.innerHTML = '';
      } catch(e) { Toast.error('Invalid unicode escape: ' + e.message); }
    }

    document.getElementById('uniToCode').addEventListener('click', textToUni);
    document.getElementById('uniFromCode').addEventListener('click', uniToText);
    document.getElementById('uniClear').addEventListener('click', () => {
      input.value=''; output.value=''; jsOut.value=''; cssOut.value=''; table.innerHTML='';
    });
    input.addEventListener('input', () => { if (!input.value) { table.innerHTML=''; } });
  }
});

})();
