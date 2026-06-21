'use strict';
(function() {

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ──────────────────────────────────────────────
// IOC EXTRACTOR
// ──────────────────────────────────────────────
const IOC_PATTERNS = {
  'IPv4':    { re: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, priority: 1 },
  'Domain':  { re: /\b(?:[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|gov|edu|mil|int|info|biz|co|uk|de|fr|ru|cn|jp|br|au|ca|nl|se|no|fi|dk|eu|xyz|online|site|app|dev|cloud|tech)\b/gi, priority: 2 },
  'URL':     { re: /https?:\/\/[^\s\x00-\x1f"'<>(){}[\]\\,;:!*@]+/gi, priority: 0 },
  'Email':   { re: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g, priority: 3 },
  'MD5':     { re: /\b[0-9a-fA-F]{32}\b/g, priority: 5 },
  'SHA1':    { re: /\b[0-9a-fA-F]{40}\b/g, priority: 5 },
  'SHA256':  { re: /\b[0-9a-fA-F]{64}\b/g, priority: 5 },
  'SHA512':  { re: /\b[0-9a-fA-F]{128}\b/g, priority: 5 },
  'CVE':     { re: /CVE-\d{4}-\d{4,7}/gi, priority: 4 },
  'CIDR':    { re: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\/(?:[0-9]|[12][0-9]|3[0-2])\b/g, priority: 1 },
  'Registry':{ re: /(?:HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKLM|HKCU)\\[A-Za-z0-9\\\-_. ]+/gi, priority: 6 },
};

// IPs to exclude (private/loopback) — show but mark
function isPrivateIP(ip) {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|255\.255\.255\.255)/.test(ip);
}

ToolRegistry.push({
  id: 'ioc-extractor',
  name: 'IOC Extractor',
  category: 'soc',
  description: 'Extract Indicators of Compromise (IPs, domains, URLs, hashes, CVEs, emails) from any text block.',
  tags: ['ioc','indicator','extract','ip','domain','url','hash','cve','email','threat','intel','dfir'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="iocInput">
          Paste text, logs, or threat report
          <span class="tool-label-badge">bulk extract</span>
        </label>
        <textarea class="tool-textarea" id="iocInput" placeholder="Paste emails, log lines, threat intelligence reports, malware analysis, or any text containing IOCs..." style="min-height:180px" spellcheck="false"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="iocExtract">Extract IOCs</button>
        <button class="btn btn-secondary" id="iocCopyAll">Copy All</button>
        <button class="btn btn-ghost btn-icon" id="iocClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div id="iocResult" style="margin-top:var(--sp-4)"></div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('iocInput');
    const result = document.getElementById('iocResult');
    let allIOCs  = [];

    document.getElementById('iocExtract').addEventListener('click', () => {
      const text = input.value;
      if (!text.trim()) { result.innerHTML=''; return; }

      allIOCs = [];
      const found = {};

      // Extract in priority order to avoid double-matching
      const matched = new Set();
      Object.entries(IOC_PATTERNS).sort((a,b)=>a[1].priority-b[1].priority).forEach(([type, {re}]) => {
        const pattern = new RegExp(re.source, re.flags);
        let m;
        while ((m = pattern.exec(text)) !== null) {
          const val = m[0];
          if (!matched.has(val) || type === 'URL') {
            matched.add(val);
            if (!found[type]) found[type] = new Set();
            found[type].add(val);
            allIOCs.push({ type, value: val });
          }
        }
      });

      if (!Object.keys(found).length) {
        result.innerHTML = `<div class="info-box warning"><span class="info-box-icon">⚠</span>No IOCs detected in the provided text.</div>`;
        return;
      }

      const total = Object.values(found).reduce((s,v)=>s+v.size,0);
      let html = `<div style="margin-bottom:var(--sp-4)">
        <div style="font-size:13px;color:var(--text-2);margin-bottom:var(--sp-3)">
          Found <strong style="color:var(--text)">${total}</strong> IOC${total!==1?'s':''} across <strong style="color:var(--text)">${Object.keys(found).length}</strong> types
        </div>
      </div>`;

      Object.entries(found).forEach(([type, vals]) => {
        html += `<div style="margin-bottom:var(--sp-5)">
          <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-2)">
            <span class="tag tag-default" style="font-size:11px">${esc(type)}</span>
            <span style="font-size:11px;color:var(--text-3)">${vals.size} found</span>
          </div>
          <div class="ioc-list">`;
        [...vals].forEach(v => {
          const isPriv = type==='IPv4' && isPrivateIP(v);
          html += `<div class="ioc-item">
            <span class="ioc-type">${esc(type)}</span>
            <span class="ioc-value">${esc(v)}${isPriv?' <span style="color:var(--text-3);font-size:10px">(private)</span>':''}</span>
            <button class="btn btn-ghost btn-icon btn-sm ioc-copy" title="Copy" data-val="${esc(v)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>`;
        });
        html += `</div></div>`;
      });

      result.innerHTML = html;

      result.querySelectorAll('.ioc-copy').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.val).then(() => Toast.success('Copied'));
        });
      });
    });

    document.getElementById('iocCopyAll').addEventListener('click', () => {
      if (!allIOCs.length) { Toast.warning('No IOCs extracted yet'); return; }
      const text = allIOCs.map(i => `[${i.type}] ${i.value}`).join('\n');
      navigator.clipboard.writeText(text).then(() => Toast.success(`Copied ${allIOCs.length} IOCs`));
    });

    document.getElementById('iocClear').addEventListener('click', () => {
      input.value=''; result.innerHTML=''; allIOCs=[];
    });
  }
});

// ──────────────────────────────────────────────
// IOC PARSER / DEFANGING
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'ioc-parser',
  name: 'IOC Parser / Defanger',
  category: 'soc',
  description: 'Defang IOCs (make them safe to share) or refang them. Also classifies IOC type.',
  tags: ['ioc','defang','refang','parse','safe','share','url','ip','domain','indicator'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="iocpInput">IOCs (one per line)</label>
        <textarea class="tool-textarea" id="iocpInput" placeholder="192.168.1.1&#10;https://malicious.com/payload&#10;evil[.]domain[.]com&#10;user@domain.com" spellcheck="false"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="iocpDefang">Defang</button>
        <button class="btn btn-secondary" id="iocpRefang">Refang</button>
        <button class="btn btn-ghost btn-icon" id="iocpCopy" title="Copy output">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
      <div class="tool-field" style="margin-top:var(--sp-2)">
        <label class="tool-label" for="iocpOutput">Output</label>
        <textarea class="tool-textarea output" id="iocpOutput" readonly spellcheck="false"></textarea>
      </div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('iocpInput');
    const output = document.getElementById('iocpOutput');

    function defang(str) {
      return str
        .replace(/https?:\/\//g, 'hxxps://')
        .replace(/\./g, '[.]')
        .replace(/:/g, '[:]')
        .replace(/@/g, '[@]');
    }
    function refang(str) {
      return str
        .replace(/hxxps?:\/\//gi, m => m.replace('hxxp','http').replace('[:]','://'))
        .replace(/\[\.]/g, '.')
        .replace(/\[\:]/g, ':')
        .replace(/\[@]/g, '@');
    }

    document.getElementById('iocpDefang').addEventListener('click', () => {
      output.value = input.value.split('\n').map(l => l.trim() ? defang(l) : '').join('\n');
    });
    document.getElementById('iocpRefang').addEventListener('click', () => {
      output.value = input.value.split('\n').map(l => l.trim() ? refang(l) : '').join('\n');
    });
    document.getElementById('iocpCopy').addEventListener('click', () => {
      navigator.clipboard.writeText(output.value).then(() => Toast.success('Copied'));
    });
  }
});

// ──────────────────────────────────────────────
// TIMESTAMP CONVERTER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'timestamp',
  name: 'Timestamp Converter',
  category: 'soc',
  description: 'Convert Unix epoch timestamps to human-readable dates and vice versa across timezones.',
  tags: ['timestamp','epoch','unix','time','date','convert','utc','timezone','dfir'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="tsEpoch">Unix Timestamp (seconds or ms)</label>
          <input type="number" class="tool-input font-mono" id="tsEpoch" placeholder="1700000000">
        </div>
        <div class="tool-field">
          <label class="tool-label" for="tsHuman">Human Readable Date</label>
          <input type="datetime-local" class="tool-input" id="tsHuman">
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="tsNow">Now</button>
        <button class="btn btn-secondary" id="tsFromEpoch">Epoch → Date</button>
        <button class="btn btn-secondary" id="tsFromDate">Date → Epoch</button>
      </div>
      <div id="tsResult" style="margin-top:var(--sp-4);display:none">
        <div class="code-block" style="padding:var(--sp-5)">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-4)">All Formats</div>
          <div id="tsDetails" style="display:flex;flex-direction:column;gap:var(--sp-3);font-family:var(--font-mono);font-size:13px"></div>
        </div>
      </div>
    </div>`;
  },
  init() {
    const epochIn  = document.getElementById('tsEpoch');
    const humanIn  = document.getElementById('tsHuman');
    const result   = document.getElementById('tsResult');
    const details  = document.getElementById('tsDetails');

    function row(l,v){ return `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:var(--text-3);white-space:nowrap">${esc(l)}</span><span style="color:var(--text)">${esc(v)}</span></div>`; }

    function showDate(d) {
      if (isNaN(d.getTime())) { Toast.error('Invalid date/timestamp'); return; }
      const sec = Math.floor(d.getTime() / 1000);
      const ms  = d.getTime();
      details.innerHTML =
        row('UTC',           d.toUTCString()) +
        row('ISO 8601',      d.toISOString()) +
        row('Local',         d.toLocaleString()) +
        row('Unix (s)',      sec.toString()) +
        row('Unix (ms)',     ms.toString()) +
        row('Unix (µs)',     ms + '000') +
        row('Day of Week',   ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()]) +
        row('Day of Year',   (Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / 86400000)).toString()) +
        row('Week Number',   Math.ceil((((d - new Date(d.getFullYear(),0,1))/86400000) + new Date(d.getFullYear(),0,1).getDay()+1)/7).toString()) +
        row('Relative',      relativeTime(d));
      result.style.display='block';
    }

    function relativeTime(d) {
      const diff = (Date.now() - d.getTime()) / 1000;
      const abs  = Math.abs(diff);
      const suf  = diff > 0 ? ' ago' : ' from now';
      if (abs < 60) return Math.round(abs) + ' seconds' + suf;
      if (abs < 3600) return Math.round(abs/60) + ' minutes' + suf;
      if (abs < 86400) return Math.round(abs/3600) + ' hours' + suf;
      if (abs < 31536000) return Math.round(abs/86400) + ' days' + suf;
      return Math.round(abs/31536000) + ' years' + suf;
    }

    document.getElementById('tsNow').addEventListener('click', () => {
      const d = new Date();
      epochIn.value = Math.floor(d.getTime()/1000);
      humanIn.value = d.toISOString().slice(0,16);
      showDate(d);
    });

    document.getElementById('tsFromEpoch').addEventListener('click', () => {
      let v = parseInt(epochIn.value);
      if (isNaN(v)) { Toast.error('Enter a valid epoch timestamp'); return; }
      if (v > 1e10) v = Math.floor(v / 1000); // ms
      showDate(new Date(v * 1000));
    });

    document.getElementById('tsFromDate').addEventListener('click', () => {
      const d = new Date(humanIn.value);
      epochIn.value = Math.floor(d.getTime()/1000);
      showDate(d);
    });
  }
});

// ──────────────────────────────────────────────
// CVSS 3.1 CALCULATOR
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'cvss',
  name: 'CVSS 3.1 Calculator',
  category: 'soc',
  description: 'Calculate CVSS v3.1 Base Score from attack vector, complexity, privileges, user interaction, scope, and impact metrics.',
  tags: ['cvss','vulnerability','score','severity','risk','3.1','v3','cve','security','assessment'],
  render() {
    const sel = (id, label, opts) => `
      <div class="tool-field">
        <label class="tool-label" for="${id}" style="text-transform:none;letter-spacing:0;font-size:12px">${esc(label)}</label>
        <select class="tool-select" id="${id}">
          ${opts.map(([v,l]) => `<option value="${v}">${esc(l)}</option>`).join('')}
        </select>
      </div>`;

    return `
    <div class="tool-body">
      <div class="cvss-score-display" id="cvssScoreDisplay">
        <div class="cvss-score-num none" id="cvssNum">—</div>
        <div class="cvss-score-meta">
          <div class="cvss-score-severity" id="cvssSev">No score yet</div>
          <div class="cvss-score-vector" id="cvssVec">CVSS:3.1/AV:_/AC:_/PR:_/UI:_/S:_/C:_/I:_/A:_</div>
        </div>
      </div>
      <div class="cvss-grid" style="margin-top:var(--sp-5)">
        <div class="cvss-group">
          <div class="cvss-group-title">Exploitability Metrics</div>
          ${sel('cvssAV','Attack Vector (AV)',[['N','Network'],['A','Adjacent'],['L','Local'],['P','Physical']])}
          ${sel('cvssAC','Attack Complexity (AC)',[['L','Low'],['H','High']])}
          ${sel('cvssPR','Privileges Required (PR)',[['N','None'],['L','Low'],['H','High']])}
          ${sel('cvssUI','User Interaction (UI)',[['N','None'],['R','Required']])}
        </div>
        <div class="cvss-group">
          <div class="cvss-group-title">Impact Metrics</div>
          ${sel('cvssS','Scope (S)',[['U','Unchanged'],['C','Changed']])}
          ${sel('cvssC','Confidentiality (C)',[['N','None'],['L','Low'],['H','High']])}
          ${sel('cvssI','Integrity (I)',[['N','None'],['L','Low'],['H','High']])}
          ${sel('cvssA','Availability (A)',[['N','None'],['L','Low'],['H','High']])}
        </div>
      </div>
      <div class="tool-actions" style="margin-top:var(--sp-4)">
        <button class="btn btn-primary" id="cvssCalc">Calculate Score</button>
        <button class="btn btn-ghost btn-icon" id="cvssCopyVec" title="Copy vector string">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
    </div>`;
  },
  init() {
    const numEl = document.getElementById('cvssNum');
    const sevEl = document.getElementById('cvssSev');
    const vecEl = document.getElementById('cvssVec');
    let lastVec = '';

    const AV  = {N:0.85, A:0.62, L:0.55, P:0.2};
    const AC  = {L:0.77, H:0.44};
    const PR_U= {N:0.85, L:0.62, H:0.27};
    const PR_C= {N:0.85, L:0.68, H:0.50};
    const UI  = {N:0.85, R:0.62};
    const IMP = {N:0.00, L:0.22, H:0.56};

    function roundUp(x) { return Math.ceil(x * 10) / 10; }

    function calc() {
      const av = document.getElementById('cvssAV').value;
      const ac = document.getElementById('cvssAC').value;
      const pr = document.getElementById('cvssPR').value;
      const ui = document.getElementById('cvssUI').value;
      const s  = document.getElementById('cvssS').value;
      const c  = document.getElementById('cvssC').value;
      const i  = document.getElementById('cvssI').value;
      const a  = document.getElementById('cvssA').value;

      const ISCBase = 1 - (1 - IMP[c]) * (1 - IMP[i]) * (1 - IMP[a]);
      const ISS     = s === 'U'
        ? 6.42 * ISCBase
        : 7.52 * (ISCBase - 0.029) - 3.25 * Math.pow(ISCBase - 0.02, 15);
      if (ISS <= 0) { numEl.textContent='0.0'; sevEl.textContent='None'; numEl.className='cvss-score-num none'; return; }

      const prVal = s === 'C' ? PR_C[pr] : PR_U[pr];
      const exploitability = 8.22 * AV[av] * AC[ac] * prVal * UI[ui];

      const baseScore = s === 'U'
        ? roundUp(Math.min(ISS + exploitability, 10))
        : roundUp(Math.min(1.08 * (ISS + exploitability), 10));

      const sev = baseScore === 0 ? 'None' : baseScore < 4 ? 'Low' : baseScore < 7 ? 'Medium' : baseScore < 9 ? 'High' : 'Critical';
      const cls = sev.toLowerCase();

      numEl.textContent = baseScore.toFixed(1);
      numEl.className = `cvss-score-num ${cls}`;
      sevEl.textContent = sev;

      lastVec = `CVSS:3.1/AV:${av}/AC:${ac}/PR:${pr}/UI:${ui}/S:${s}/C:${c}/I:${i}/A:${a}`;
      vecEl.textContent = lastVec;
    }

    document.getElementById('cvssCalc').addEventListener('click', calc);
    document.querySelectorAll('#cvssAV,#cvssAC,#cvssPR,#cvssUI,#cvssS,#cvssC,#cvssI,#cvssA').forEach(el => {
      el.addEventListener('change', calc);
    });
    document.getElementById('cvssCopyVec').addEventListener('click', () => {
      if (lastVec) navigator.clipboard.writeText(lastVec).then(() => Toast.success('CVSS vector copied'));
    });

    calc();
  }
});

// ──────────────────────────────────────────────
// LOG ANALYZER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'log-analyzer',
  name: 'Log Analyzer',
  category: 'soc',
  description: 'Parse and analyze common log formats: Apache/Nginx access logs, Windows Event logs, syslog.',
  tags: ['log','analyzer','parse','apache','nginx','syslog','windows','event','dfir','access log'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="logInput">Paste Log Lines</label>
        <textarea class="tool-textarea" id="logInput" placeholder='192.168.1.1 - alice [10/Nov/2024:13:55:36 -0700] "POST /login HTTP/1.1" 200 1234 "-" "Mozilla/5.0"' spellcheck="false" style="min-height:160px;font-size:12px"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="logAnalyze">Analyze</button>
        <button class="btn btn-ghost btn-icon" id="logClear" title="Clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div id="logResult" style="margin-top:var(--sp-4)"></div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('logInput');
    const result = document.getElementById('logResult');

    // Apache/Nginx Combined Log Format
    const APACHE_RE = /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"([A-Z]+)\s+(\S+)\s+HTTP\/[\d.]+"\s+(\d+)\s+(\d+|-)/;
    // Syslog
    const SYSLOG_RE = /^(\w{3}\s+\d+\s+[\d:]+)\s+(\S+)\s+([^\[:]+)(?:\[(\d+)\])?:\s*(.*)/;

    document.getElementById('logAnalyze').addEventListener('click', () => {
      const lines = input.value.trim().split('\n').filter(l=>l.trim());
      if (!lines.length) return;

      const parsed = [];
      const stats = { ips: {}, methods: {}, statuses: {}, paths: {}, users: {}, errors: 0, total: 0 };

      lines.forEach(line => {
        stats.total++;
        const apache = line.match(APACHE_RE);
        if (apache) {
          const [,ip,,date,method,path,status,bytes] = apache;
          parsed.push({type:'apache', ip, date, method, path, status, bytes});
          stats.ips[ip] = (stats.ips[ip]||0) + 1;
          stats.methods[method] = (stats.methods[method]||0) + 1;
          stats.statuses[status] = (stats.statuses[status]||0) + 1;
          stats.paths[path] = (stats.paths[path]||0) + 1;
          if (status.startsWith('4') || status.startsWith('5')) stats.errors++;
          return;
        }
        const syslog = line.match(SYSLOG_RE);
        if (syslog) {
          const [,date,host,process,,msg] = syslog;
          parsed.push({type:'syslog', date, host, process, msg});
          return;
        }
        parsed.push({type:'unknown', raw: line});
      });

      const topIPs    = Object.entries(stats.ips).sort((a,b)=>b[1]-a[1]).slice(0,10);
      const topPaths  = Object.entries(stats.paths).sort((a,b)=>b[1]-a[1]).slice(0,10);
      const fmt       = (label, count) => `<div style="display:flex;justify-content:space-between"><span style="color:var(--text-3)">${esc(label)}</span><span style="color:var(--text);font-family:var(--font-mono)">${count}</span></div>`;
      const topList   = (entries) => entries.map(([k,v]) => `<div style="display:flex;justify-content:space-between;gap:8px"><span style="color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-mono);font-size:12px">${esc(k)}</span><span style="color:var(--text);font-family:var(--font-mono);font-size:12px;flex-shrink:0">${v}</span></div>`).join('');

      const apacheCount = parsed.filter(p=>p.type==='apache').length;
      const syslogCount = parsed.filter(p=>p.type==='syslog').length;
      const unknown     = parsed.filter(p=>p.type==='unknown').length;

      result.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-4)">
          <div class="code-block" style="padding:var(--sp-4)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-3)">Summary</div>
            <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
              ${fmt('Total lines', stats.total)}
              ${fmt('Apache/Nginx', apacheCount)}
              ${fmt('Syslog', syslogCount)}
              ${fmt('Unrecognized', unknown)}
              ${fmt('Error responses (4xx/5xx)', stats.errors)}
              ${fmt('Unique IPs', Object.keys(stats.ips).length)}
              ${fmt('Methods', Object.entries(stats.methods).map(([k,v])=>`${k}(${v})`).join(', '))}
              ${fmt('Status codes', Object.entries(stats.statuses).sort().map(([k,v])=>`${k}(${v})`).join(', '))}
            </div>
          </div>
          ${topIPs.length ? `<div class="code-block" style="padding:var(--sp-4)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-3)">Top IPs</div>
            <div style="display:flex;flex-direction:column;gap:var(--sp-2)">${topList(topIPs)}</div>
          </div>` : ''}
          ${topPaths.length ? `<div class="code-block" style="padding:var(--sp-4)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-3)">Top Paths</div>
            <div style="display:flex;flex-direction:column;gap:var(--sp-2)">${topList(topPaths)}</div>
          </div>` : ''}
        </div>`;
    });

    document.getElementById('logClear').addEventListener('click', () => { input.value=''; result.innerHTML=''; });
  }
});

})();
