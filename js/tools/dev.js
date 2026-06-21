'use strict';
(function() {

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ──────────────────────────────────────────────
// UUID GENERATOR
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'uuid',
  name: 'UUID Generator',
  category: 'developer',
  description: 'Generate cryptographically secure UUID v4 identifiers in bulk.',
  tags: ['uuid','guid','generate','v4','random','identifier','unique'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="uuidCount">
            Count <span class="tool-label-badge" id="uuidCountVal">10</span>
          </label>
          <div class="range-wrap">
            <input type="range" class="tool-range" id="uuidCount" min="1" max="100" value="10">
            <span class="range-val" id="uuidCountDisplay">10</span>
          </div>
        </div>
        <div class="tool-field">
          <label class="tool-label">Format</label>
          <div class="check-row">
            <label class="check-label"><input type="radio" name="uuidFmt" value="standard" checked> Standard (lowercase)</label>
            <label class="check-label"><input type="radio" name="uuidFmt" value="upper"> Uppercase</label>
            <label class="check-label"><input type="radio" name="uuidFmt" value="braces"> {With Braces}</label>
            <label class="check-label"><input type="radio" name="uuidFmt" value="nodash"> No Dashes</label>
          </div>
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="uuidGen">Generate</button>
        <button class="btn btn-secondary" id="uuidOne">Single UUID</button>
        <button class="btn btn-ghost btn-icon" id="uuidCopy" title="Copy all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
      <div class="tool-field" style="margin-top:var(--sp-2)">
        <label class="tool-label" for="uuidOutput">UUIDs</label>
        <textarea class="tool-textarea output font-mono" id="uuidOutput" readonly style="font-size:13px;min-height:200px"></textarea>
      </div>
    </div>`;
  },
  init() {
    const countRange = document.getElementById('uuidCount');
    const countDisp  = document.getElementById('uuidCountDisplay');
    const output     = document.getElementById('uuidOutput');

    countRange.addEventListener('input', () => { countDisp.textContent = countRange.value; });

    function genUUID() {
      if (crypto.randomUUID) return crypto.randomUUID();
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      buf[6] = (buf[6] & 0x0f) | 0x40;
      buf[8] = (buf[8] & 0x3f) | 0x80;
      const hex = Array.from(buf).map(b=>b.toString(16).padStart(2,'0')).join('');
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }

    function formatUUID(uuid) {
      const fmt = document.querySelector('input[name="uuidFmt"]:checked').value;
      switch(fmt) {
        case 'upper':   return uuid.toUpperCase();
        case 'braces':  return '{' + uuid.toUpperCase() + '}';
        case 'nodash':  return uuid.replace(/-/g,'');
        default:        return uuid;
      }
    }

    document.getElementById('uuidGen').addEventListener('click', () => {
      const n = parseInt(countRange.value);
      output.value = Array.from({length:n}, () => formatUUID(genUUID())).join('\n');
    });

    document.getElementById('uuidOne').addEventListener('click', () => {
      const u = formatUUID(genUUID());
      output.value = u;
      navigator.clipboard.writeText(u).then(() => Toast.success('UUID copied to clipboard'));
    });

    document.getElementById('uuidCopy').addEventListener('click', () => {
      if (output.value) navigator.clipboard.writeText(output.value).then(() => Toast.success('Copied all UUIDs'));
    });
  }
});

// ──────────────────────────────────────────────
// REGEX TESTER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'regex',
  name: 'Regex Tester',
  category: 'developer',
  description: 'Test regular expressions against text with real-time match highlighting and capture group display.',
  tags: ['regex','regular expression','test','pattern','match','capture','flags','find'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="rePattern">Regular Expression</label>
          <div style="display:flex;gap:var(--sp-2)">
            <div style="position:relative;flex:1">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-family:var(--font-mono)">/</span>
              <input type="text" class="tool-input font-mono" id="rePattern" placeholder="(\d{1,3}\.){3}\d{1,3}" style="padding-left:24px;padding-right:24px">
              <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-family:var(--font-mono)" id="reSlashFlags">/</span>
            </div>
            <input type="text" class="tool-input font-mono" id="reFlags" placeholder="gim" value="g" style="width:80px" maxlength="8">
          </div>
        </div>
      </div>
      <div class="tool-field">
        <label class="tool-label" for="reInput">Test String</label>
        <textarea class="tool-textarea" id="reInput" placeholder="Enter text to test your regex against..." spellcheck="false" style="min-height:140px"></textarea>
      </div>
      <div class="tool-status" id="reStatus">
        <span class="tool-status-dot" id="reDot"></span>
        <span id="reMsg" class="tool-status-msg">Enter a pattern to start matching</span>
      </div>
      <div id="reMatchArea" style="display:none;margin-top:var(--sp-4)">
        <div class="tool-field">
          <label class="tool-label">Matches <span class="tool-label-badge" id="reCount">0</span></label>
          <div id="reHighlight" style="font-family:var(--font-mono);font-size:13px;line-height:1.8;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-4);white-space:pre-wrap;word-break:break-all;max-height:200px;overflow:auto"></div>
        </div>
        <div class="tool-field">
          <label class="tool-label">Match Details</label>
          <div id="reDetails" class="code-block" style="max-height:200px;overflow:auto">
            <pre id="reDetailsPre" style="padding:var(--sp-4);font-size:12px"></pre>
          </div>
        </div>
      </div>
    </div>`;
  },
  init() {
    const pattern   = document.getElementById('rePattern');
    const flags     = document.getElementById('reFlags');
    const testInput = document.getElementById('reInput');
    const dot       = document.getElementById('reDot');
    const msg       = document.getElementById('reMsg');
    const matchArea = document.getElementById('reMatchArea');
    const highlight = document.getElementById('reHighlight');
    const countEl   = document.getElementById('reCount');
    const detailsPre = document.getElementById('reDetailsPre');

    function run() {
      const pat  = pattern.value;
      const flg  = flags.value.replace(/[^gimsuy]/g,'');
      const text = testInput.value;

      document.getElementById('reSlashFlags').textContent = '/' + flg;

      if (!pat) {
        dot.className='tool-status-dot'; msg.textContent='Enter a pattern'; matchArea.style.display='none'; return;
      }

      let re;
      try {
        re = new RegExp(pat, flg.includes('g') ? flg : flg+'g');
      } catch(e) {
        dot.className='tool-status-dot error'; msg.textContent='Invalid regex: '+e.message;
        matchArea.style.display='none'; return;
      }

      if (!text) {
        dot.className='tool-status-dot'; msg.textContent='Enter test string'; matchArea.style.display='none'; return;
      }

      const matches = [...text.matchAll(re)];
      if (!matches.length) {
        dot.className='tool-status-dot error'; msg.textContent='No matches';
        matchArea.style.display='none'; return;
      }

      dot.className='tool-status-dot ok';
      msg.textContent = `${matches.length} match${matches.length!==1?'es':''} found`;
      countEl.textContent = matches.length;
      matchArea.style.display='block';

      // Highlight matches
      let result = '';
      let last = 0;
      matches.forEach(m => {
        result += esc(text.slice(last, m.index));
        result += `<mark style="background:rgba(107,140,255,0.25);color:var(--info);border-radius:2px;outline:1px solid rgba(107,140,255,0.4)">${esc(m[0])}</mark>`;
        last = m.index + m[0].length;
      });
      result += esc(text.slice(last));
      highlight.innerHTML = result;

      // Details
      const details = matches.map((m, i) => {
        let line = `Match ${i+1}: [${m.index}–${m.index+m[0].length}] "${m[0]}"`;
        if (m.length > 1) {
          m.slice(1).forEach((g,gi) => { line += `\n  Group ${gi+1}: ${g !== undefined ? `"${g}"` : 'undefined'}`; });
        }
        return line;
      }).join('\n\n');
      detailsPre.textContent = details;
    }

    let timer;
    [pattern, flags, testInput].forEach(el => {
      el.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 200); });
    });
  }
});

// ──────────────────────────────────────────────
// TEXT DIFF
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'text-diff',
  name: 'Text Diff Tool',
  category: 'developer',
  description: 'Compare two text blocks and highlight differences line by line.',
  tags: ['diff','compare','text','difference','line','change','delta','merge'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="diffA">Original Text (A)</label>
          <textarea class="tool-textarea" id="diffA" placeholder="Original text..." spellcheck="false" style="min-height:160px"></textarea>
        </div>
        <div class="tool-field">
          <label class="tool-label" for="diffB">Modified Text (B)</label>
          <textarea class="tool-textarea" id="diffB" placeholder="Modified text..." spellcheck="false" style="min-height:160px"></textarea>
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="diffRun">Compare</button>
        <button class="btn btn-ghost btn-icon" id="diffClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div id="diffResult" style="display:none;margin-top:var(--sp-4)">
        <div class="tool-status" style="margin-bottom:var(--sp-4)">
          <span class="tool-status-dot" id="diffDot"></span>
          <span id="diffMsg" class="tool-status-msg"></span>
        </div>
        <div class="diff-output" id="diffOut"></div>
      </div>
    </div>`;
  },
  init() {
    function lcs(a, b) {
      const m = a.length, n = b.length;
      const dp = Array.from({length:m+1}, ()=>new Array(n+1).fill(0));
      for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
        dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j],dp[i][j-1]);
      const result = [];
      let i=m, j=n;
      while (i>0||j>0) {
        if (i>0&&j>0&&a[i-1]===b[j-1]) { result.unshift({type:'=',val:a[i-1]}); i--;j--; }
        else if (j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])) { result.unshift({type:'+',val:b[j-1]}); j--; }
        else { result.unshift({type:'-',val:a[i-1]}); i--; }
      }
      return result;
    }

    document.getElementById('diffRun').addEventListener('click', () => {
      const a = document.getElementById('diffA').value.split('\n');
      const b = document.getElementById('diffB').value.split('\n');
      const diff = lcs(a, b);

      let added=0, removed=0, unchanged=0;
      const html = diff.map(({type,val}) => {
        if (type==='+') { added++; return `<span class="diff-added">+ ${esc(val)}</span>`; }
        if (type==='-') { removed++; return `<span class="diff-removed">- ${esc(val)}</span>`; }
        unchanged++;
        return `<span class="diff-equal">  ${esc(val)}</span>`;
      }).join('\n');

      document.getElementById('diffOut').innerHTML = html;
      document.getElementById('diffResult').style.display='block';
      const dot = document.getElementById('diffDot');
      const msg = document.getElementById('diffMsg');
      if (added===0&&removed===0) {
        dot.className='tool-status-dot ok'; msg.textContent='Files are identical';
      } else {
        dot.className='tool-status-dot warn';
        msg.textContent=`+${added} added · -${removed} removed · ${unchanged} unchanged`;
      }
    });

    document.getElementById('diffClear').addEventListener('click', () => {
      document.getElementById('diffA').value='';
      document.getElementById('diffB').value='';
      document.getElementById('diffResult').style.display='none';
    });
  }
});

// ──────────────────────────────────────────────
// WORD COUNTER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'word-counter',
  name: 'Word Counter',
  category: 'developer',
  description: 'Count words, characters, sentences, paragraphs, and estimate reading time.',
  tags: ['word','count','character','line','paragraph','reading time','text','length'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="wcInput">Text Input</label>
        <textarea class="tool-textarea" id="wcInput" placeholder="Type or paste text here..." style="min-height:200px"></textarea>
      </div>
      <div id="wcStats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;margin-top:var(--sp-4)">
        <div style="background:var(--bg-2);padding:var(--sp-4);text-align:center">
          <div style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:var(--text)" id="wcWords">0</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-top:4px">Words</div>
        </div>
        <div style="background:var(--bg-2);padding:var(--sp-4);text-align:center">
          <div style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:var(--text)" id="wcChars">0</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-top:4px">Characters</div>
        </div>
        <div style="background:var(--bg-2);padding:var(--sp-4);text-align:center">
          <div style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:var(--text)" id="wcLines">0</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-top:4px">Lines</div>
        </div>
        <div style="background:var(--bg-2);padding:var(--sp-4);text-align:center">
          <div style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:var(--text)" id="wcRead">0</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-top:4px">Min Read</div>
        </div>
      </div>
      <div id="wcExtra" style="margin-top:var(--sp-3);display:flex;gap:var(--sp-4);font-size:12px;color:var(--text-3);flex-wrap:wrap"></div>
    </div>`;
  },
  init() {
    const input = document.getElementById('wcInput');
    const els   = { words:'wcWords', chars:'wcChars', lines:'wcLines', read:'wcRead' };
    const extra = document.getElementById('wcExtra');

    input.addEventListener('input', () => {
      const text   = input.value;
      const words  = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars  = text.length;
      const noSpace= text.replace(/\s/g,'').length;
      const lines  = text.split('\n').length;
      const sents  = (text.match(/[.!?]+/g)||[]).length;
      const paras  = text.split(/\n\s*\n/).filter(p=>p.trim()).length;
      const read   = Math.ceil(words / 200) || 0;
      const bytes  = new Blob([text]).size;

      document.getElementById('wcWords').textContent = words.toLocaleString();
      document.getElementById('wcChars').textContent = chars.toLocaleString();
      document.getElementById('wcLines').textContent = lines.toLocaleString();
      document.getElementById('wcRead').textContent  = read;

      extra.innerHTML = [
        `No-space chars: ${noSpace.toLocaleString()}`,
        `Sentences: ${sents}`,
        `Paragraphs: ${paras}`,
        `Bytes: ${bytes.toLocaleString()}`,
        `Unique words: ${new Set(text.toLowerCase().match(/\b\w+\b/g)||[]).size}`,
      ].map(s=>`<span>${esc(s)}</span>`).join('');
    });
  }
});

// ──────────────────────────────────────────────
// CASE CONVERTER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'case-converter',
  name: 'Case Converter',
  category: 'developer',
  description: 'Convert text between camelCase, PascalCase, snake_case, kebab-case, UPPER_SNAKE, and more.',
  tags: ['case','convert','camel','snake','pascal','kebab','upper','lower','title','text'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="caseInput">Input Text</label>
        <textarea class="tool-textarea" id="caseInput" placeholder="hello world or helloWorld or hello-world..." rows="4" spellcheck="false"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="caseConvert">Convert All</button>
        <button class="btn btn-ghost btn-icon" id="caseClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div id="caseResult" style="display:none;margin-top:var(--sp-4)">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden" id="caseGrid"></div>
      </div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('caseInput');
    const result = document.getElementById('caseResult');
    const grid   = document.getElementById('caseGrid');

    // Split any case input into words
    function toWords(str) {
      return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')   // camel → words
        .replace(/[_\-]/g, ' ')                  // snake/kebab → words
        .replace(/\s+/g, ' ').trim()
        .toLowerCase().split(' ').filter(Boolean);
    }

    const conversions = [
      ['lowercase',          w => w.join(' ')],
      ['UPPERCASE',          w => w.join(' ').toUpperCase()],
      ['Title Case',         w => w.map(s=>s[0].toUpperCase()+s.slice(1)).join(' ')],
      ['camelCase',          w => w[0] + w.slice(1).map(s=>s[0].toUpperCase()+s.slice(1)).join('')],
      ['PascalCase',         w => w.map(s=>s[0].toUpperCase()+s.slice(1)).join('')],
      ['snake_case',         w => w.join('_')],
      ['UPPER_SNAKE_CASE',   w => w.join('_').toUpperCase()],
      ['kebab-case',         w => w.join('-')],
      ['UPPER-KEBAB-CASE',   w => w.join('-').toUpperCase()],
      ['dot.case',           w => w.join('.')],
      ['Sentence case',      w => { const s=w.join(' '); return s[0].toUpperCase()+s.slice(1); }],
      ['Inverted Case',      w => w.join(' ').split('').map((c,i)=>i%2===0?c.toLowerCase():c.toUpperCase()).join('')],
    ];

    document.getElementById('caseConvert').addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) return;
      const words = toWords(text);
      if (!words.length) return;

      grid.innerHTML = conversions.map(([name, fn]) => {
        const val = fn(words);
        return `<div style="background:var(--bg-2);padding:var(--sp-3) var(--sp-4)">
          <div style="font-size:11px;color:var(--text-3);margin-bottom:4px">${esc(name)}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <code style="flex:1;font-family:var(--font-mono);font-size:13px;color:var(--text);word-break:break-all">${esc(val)}</code>
            <button class="btn btn-ghost btn-icon btn-sm" data-copy="${esc(val)}" title="Copy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>`;
      }).join('');

      grid.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.copy).then(() => Toast.success('Copied'));
        });
      });

      result.style.display='block';
    });

    document.getElementById('caseClear').addEventListener('click', () => {
      input.value=''; result.style.display='none';
    });

    input.addEventListener('keydown', e => {
      if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('caseConvert').click(); }
    });
  }
});

})();
