'use strict';
(function() {

// ──────────────────────────────────────────────
// PASSWORD GENERATOR
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'password-gen',
  name: 'Password Generator',
  category: 'password',
  description: 'Generate cryptographically secure random passwords with custom length and character sets.',
  tags: ['password','generator','random','secure','passphrase','generate','credential'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="pgLen">
          Length <span class="tool-label-badge" id="pgLenVal">20</span>
        </label>
        <div class="range-wrap">
          <input type="range" class="tool-range" id="pgLen" min="4" max="128" value="20">
          <span class="range-val" id="pgLenDisplay">20</span>
        </div>
      </div>
      <div class="tool-field">
        <label class="tool-label">Character Sets</label>
        <div class="check-row">
          <label class="check-label"><input type="checkbox" id="pgUpper" checked> Uppercase (A–Z)</label>
          <label class="check-label"><input type="checkbox" id="pgLower" checked> Lowercase (a–z)</label>
          <label class="check-label"><input type="checkbox" id="pgNum" checked> Numbers (0–9)</label>
          <label class="check-label"><input type="checkbox" id="pgSym" checked> Symbols (!@#$...)</label>
        </div>
        <div class="check-row" style="margin-top:var(--sp-2)">
          <label class="check-label"><input type="checkbox" id="pgNoAmb"> Exclude ambiguous (0,O,l,1,I)</label>
          <label class="check-label"><input type="checkbox" id="pgNoRep"> No repeating characters</label>
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="pgGenerate">Generate Password</button>
        <button class="btn btn-secondary" id="pgGenMulti">Generate 5</button>
        <button class="btn btn-ghost btn-icon" id="pgCopy" title="Copy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
      <div class="tool-field">
        <label class="tool-label" for="pgOutput">Generated Password</label>
        <input type="text" class="tool-input font-mono" id="pgOutput" readonly style="font-size:15px;height:44px;letter-spacing:0.05em">
      </div>
      <div id="pgStrengthWrap" style="margin-top:var(--sp-2);display:none">
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--sp-1)">
          <span style="font-size:12px;color:var(--text-3)">Strength</span>
          <span style="font-size:12px;color:var(--text-2)" id="pgStrLabel">—</span>
        </div>
        <div class="strength-bar-wrap" id="pgStrBar">
          <div class="strength-seg" id="ps1"></div>
          <div class="strength-seg" id="ps2"></div>
          <div class="strength-seg" id="ps3"></div>
          <div class="strength-seg" id="ps4"></div>
        </div>
        <div style="font-size:11px;color:var(--text-3);margin-top:var(--sp-2);font-family:var(--font-mono)" id="pgEntropy"></div>
      </div>
      <div class="tool-field" id="pgMultiWrap" style="display:none">
        <label class="tool-label">Batch (5 passwords)</label>
        <textarea class="tool-textarea output" id="pgMultiOutput" rows="6" readonly></textarea>
      </div>
    </div>`;
  },
  init() {
    const lenRange  = document.getElementById('pgLen');
    const lenVal    = document.getElementById('pgLenDisplay');
    const output    = document.getElementById('pgOutput');
    const strWrap   = document.getElementById('pgStrengthWrap');
    const strLabel  = document.getElementById('pgStrLabel');
    const strBar    = ['ps1','ps2','ps3','ps4'];
    const entropyEl = document.getElementById('pgEntropy');
    const multiWrap = document.getElementById('pgMultiWrap');
    const multiOut  = document.getElementById('pgMultiOutput');

    lenRange.addEventListener('input', () => { lenVal.textContent = lenRange.value; });

    const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWER = 'abcdefghijklmnopqrstuvwxyz';
    const NUMS  = '0123456789';
    const SYMS  = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    const AMB   = 'O0lI1';

    function buildCharset() {
      let cs = '';
      if (document.getElementById('pgUpper').checked) cs += UPPER;
      if (document.getElementById('pgLower').checked) cs += LOWER;
      if (document.getElementById('pgNum').checked)   cs += NUMS;
      if (document.getElementById('pgSym').checked)   cs += SYMS;
      if (document.getElementById('pgNoAmb').checked) cs = cs.split('').filter(c => !AMB.includes(c)).join('');
      return cs;
    }

    function generate() {
      const len = parseInt(lenRange.value);
      const cs  = buildCharset();
      if (!cs) { Toast.warning('Select at least one character set'); return null; }
      if (document.getElementById('pgNoRep').checked && len > cs.length) {
        Toast.warning(`Cannot generate ${len} unique chars from charset of ${cs.length}`);
        return null;
      }

      const buf = new Uint32Array(len);
      crypto.getRandomValues(buf);
      let used = new Set();
      let pwd = '';
      for (let i = 0; i < len; i++) {
        if (document.getElementById('pgNoRep').checked) {
          let c;
          do { c = cs[buf[i] % cs.length]; } while (used.has(c));
          used.add(c);
          pwd += c;
        } else {
          pwd += cs[buf[i] % cs.length];
        }
      }
      return pwd;
    }

    function calcStrength(pwd) {
      if (!pwd) return { score: 0, label: '—', entropy: 0 };
      let poolSize = 0;
      if (/[A-Z]/.test(pwd)) poolSize += 26;
      if (/[a-z]/.test(pwd)) poolSize += 26;
      if (/[0-9]/.test(pwd)) poolSize += 10;
      if (/[^A-Za-z0-9]/.test(pwd)) poolSize += 32;
      const entropy = Math.floor(pwd.length * Math.log2(poolSize || 1));
      let score, label;
      if (entropy < 28)      { score=1; label='Very Weak'; }
      else if (entropy < 36) { score=2; label='Weak'; }
      else if (entropy < 60) { score=3; label='Good'; }
      else                   { score=4; label='Strong'; }
      return { score, label, entropy };
    }

    function showStrength(pwd) {
      const { score, label, entropy } = calcStrength(pwd);
      strWrap.style.display = 'block';
      strLabel.textContent = label;
      strBar.forEach((id, i) => {
        const el = document.getElementById(id);
        el.className = 'strength-seg';
        if (i < score) el.classList.add(`s${score}`);
      });
      entropyEl.textContent = `Entropy: ~${entropy} bits · Pool: ${buildCharset().length} chars`;
    }

    document.getElementById('pgGenerate').addEventListener('click', () => {
      multiWrap.style.display = 'none';
      const pwd = generate();
      if (!pwd) return;
      output.value = pwd;
      showStrength(pwd);
    });

    document.getElementById('pgGenMulti').addEventListener('click', () => {
      const pwds = Array.from({length:5}, () => generate()).filter(Boolean);
      if (!pwds.length) return;
      multiOut.value = pwds.join('\n');
      multiWrap.style.display = 'block';
      output.value = pwds[0];
      showStrength(pwds[0]);
    });

    document.getElementById('pgCopy').addEventListener('click', () => {
      if (output.value) navigator.clipboard.writeText(output.value).then(() => Toast.success('Password copied'));
    });
  }
});

// ──────────────────────────────────────────────
// PASSWORD STRENGTH CHECKER
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'password-strength',
  name: 'Password Strength Checker',
  category: 'password',
  description: 'Analyze password strength, entropy, and security properties in real-time.',
  tags: ['password','strength','checker','entropy','security','weak','strong','analyze'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="psInput">Password</label>
        <div style="position:relative">
          <input type="password" class="tool-input" id="psInput" placeholder="Enter a password to analyze..." autocomplete="new-password" style="padding-right:48px">
          <button class="btn btn-ghost btn-icon btn-sm" id="psToggle" title="Show/hide password"
            style="position:absolute;right:6px;top:50%;transform:translateY(-50%)">
            <svg id="psEyeOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg id="psEyeClosed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
      </div>
      <div id="psResult" style="display:none">
        <div style="margin-top:var(--sp-4)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2)">
            <span style="font-size:13px;font-weight:600;color:var(--text-2)">Strength</span>
            <span style="font-size:14px;font-weight:700" id="psLabel">—</span>
          </div>
          <div class="strength-bar-wrap" id="psBar">
            <div class="strength-seg" id="pss1"></div>
            <div class="strength-seg" id="pss2"></div>
            <div class="strength-seg" id="pss3"></div>
            <div class="strength-seg" id="pss4"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-3);margin-top:var(--sp-5)">
          <div class="code-block" style="padding:var(--sp-4)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-3)">Metrics</div>
            <div id="psMetrics" style="display:flex;flex-direction:column;gap:var(--sp-2);font-size:13px;font-family:var(--font-mono)"></div>
          </div>
          <div class="code-block" style="padding:var(--sp-4)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-3)">Checklist</div>
            <div id="psChecklist" style="display:flex;flex-direction:column;gap:var(--sp-2);font-size:13px"></div>
          </div>
        </div>
      </div>
    </div>`;
  },
  init() {
    const input   = document.getElementById('psInput');
    const result  = document.getElementById('psResult');
    const label   = document.getElementById('psLabel');
    const metrics = document.getElementById('psMetrics');
    const checks  = document.getElementById('psChecklist');
    const segments = ['pss1','pss2','pss3','pss4'];
    let visible = false;

    document.getElementById('psToggle').addEventListener('click', () => {
      visible = !visible;
      input.type = visible ? 'text' : 'password';
      document.getElementById('psEyeOpen').style.display  = visible ? 'none' : '';
      document.getElementById('psEyeClosed').style.display = visible ? '' : 'none';
    });

    function metric(label, value, ok) {
      const color = ok === true ? 'var(--success)' : ok === false ? 'var(--error)' : 'var(--text-2)';
      return `<div style="display:flex;justify-content:space-between"><span style="color:var(--text-3)">${label}</span><span style="color:${color}">${value}</span></div>`;
    }
    function check(label, pass) {
      return `<div style="display:flex;align-items:center;gap:8px;color:${pass?'var(--success)':'var(--error)'}">
        <span style="font-weight:700">${pass?'✓':'✗'}</span> ${label}</div>`;
    }

    input.addEventListener('input', () => {
      const pwd = input.value;
      if (!pwd) { result.style.display='none'; return; }
      result.style.display = 'block';

      const hasUp  = /[A-Z]/.test(pwd);
      const hasLow = /[a-z]/.test(pwd);
      const hasNum = /[0-9]/.test(pwd);
      const hasSym = /[^A-Za-z0-9]/.test(pwd);

      let pool = 0;
      if (hasUp)  pool += 26;
      if (hasLow) pool += 26;
      if (hasNum) pool += 10;
      if (hasSym) pool += 32;
      const entropy = Math.floor(pwd.length * Math.log2(pool || 1));

      const unique = new Set(pwd).size;
      const repeated = pwd.length - unique;

      let score;
      if (entropy < 28)      score = 1;
      else if (entropy < 36) score = 2;
      else if (entropy < 60) score = 3;
      else                   score = 4;

      const labels = ['','Very Weak','Weak','Good','Strong'];
      const colors = ['','var(--error)','var(--warning)','#90c030','var(--success)'];
      label.textContent = labels[score];
      label.style.color = colors[score];

      segments.forEach((id, i) => {
        const el = document.getElementById(id);
        el.className = 'strength-seg';
        if (i < score) el.classList.add(`s${score}`);
      });

      metrics.innerHTML =
        metric('Length',    pwd.length, pwd.length >= 12) +
        metric('Entropy',   `~${entropy} bits`, entropy >= 60) +
        metric('Pool size', `${pool} chars`, pool >= 62) +
        metric('Unique',    `${unique}/${pwd.length}`, repeated === 0) +
        metric('Has upper', hasUp  ? 'Yes' : 'No', hasUp) +
        metric('Has lower', hasLow ? 'Yes' : 'No', hasLow) +
        metric('Has nums',  hasNum ? 'Yes' : 'No', hasNum) +
        metric('Has syms',  hasSym ? 'Yes' : 'No', hasSym);

      const commonPatterns = /^(password|123456|qwerty|abc123|letmein|admin|welcome|monkey|dragon)/i;
      checks.innerHTML =
        check('At least 12 characters', pwd.length >= 12) +
        check('At least 16 characters', pwd.length >= 16) +
        check('Uppercase letters', hasUp) +
        check('Lowercase letters', hasLow) +
        check('Numbers included', hasNum) +
        check('Special characters', hasSym) +
        check('No common patterns', !commonPatterns.test(pwd)) +
        check('60+ bits of entropy', entropy >= 60);
    });
  }
});

// ──────────────────────────────────────────────
// ENTROPY CALCULATOR
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'entropy',
  name: 'Entropy Calculator',
  category: 'password',
  description: 'Calculate Shannon entropy and password security time-to-crack estimates.',
  tags: ['entropy','shannon','bits','password','security','crack','time','estimate'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="entInput">Password or Text</label>
          <input type="text" class="tool-input font-mono" id="entInput" placeholder="Enter any string...">
        </div>
        <div class="tool-field">
          <label class="tool-label" for="entPool">Character Pool Size</label>
          <input type="number" class="tool-input" id="entPool" value="94" min="2" max="256" placeholder="94">
          <div style="font-size:11px;color:var(--text-3);margin-top:4px">Common: 10 (digits), 36 (alphanum), 62 (+case), 94 (printable ASCII)</div>
        </div>
      </div>
      <div id="entResult" style="margin-top:var(--sp-4);display:none">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-4)">
          <div class="code-block" style="padding:var(--sp-5)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-4)">Entropy Metrics</div>
            <div id="entMetrics" style="display:flex;flex-direction:column;gap:var(--sp-3);font-family:var(--font-mono);font-size:13px"></div>
          </div>
          <div class="code-block" style="padding:var(--sp-5)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-4)">Time to Crack (offline, 1B guesses/sec)</div>
            <div id="entCrack" style="display:flex;flex-direction:column;gap:var(--sp-3);font-family:var(--font-mono);font-size:13px"></div>
          </div>
        </div>
      </div>
    </div>`;
  },
  init() {
    const input   = document.getElementById('entInput');
    const pool    = document.getElementById('entPool');
    const result  = document.getElementById('entResult');
    const metrics = document.getElementById('entMetrics');
    const crack   = document.getElementById('entCrack');

    function formatTime(seconds) {
      if (seconds < 1) return '< 1 second';
      if (seconds < 60) return `${Math.round(seconds)} seconds`;
      if (seconds < 3600) return `${Math.round(seconds/60)} minutes`;
      if (seconds < 86400) return `${Math.round(seconds/3600)} hours`;
      if (seconds < 31536000) return `${Math.round(seconds/86400)} days`;
      if (seconds < 3.15e9) return `${Math.round(seconds/31536000)} years`;
      if (seconds < 3.15e12) return `${(seconds/31536000/1e3).toFixed(1)}K years`;
      if (seconds < 3.15e15) return `${(seconds/31536000/1e6).toFixed(1)}M years`;
      return '> 1 billion years (effectively uncrackable)';
    }

    function row(label, value, color) {
      return `<div style="display:flex;justify-content:space-between;gap:var(--sp-4)">
        <span style="color:var(--text-3)">${label}</span>
        <span style="color:${color||'var(--text)'};text-align:right">${value}</span>
      </div>`;
    }

    function compute() {
      const str = input.value;
      const p   = parseInt(pool.value) || 94;
      if (!str) { result.style.display='none'; return; }
      result.style.display = 'block';

      const len = str.length;
      const bitsPerChar = Math.log2(p);
      const totalBits   = bitsPerChar * len;

      // Shannon entropy
      const freq = {};
      [...str].forEach(c => freq[c] = (freq[c]||0) + 1);
      const shannon = -Object.values(freq).reduce((s,f) => s + (f/len) * Math.log2(f/len), 0);

      const combinations = Math.pow(p, len);
      const guessesPerSec = 1e9;
      const seconds = combinations / guessesPerSec;

      metrics.innerHTML =
        row('Length', len) +
        row('Pool size', p) +
        row('Bits/char', bitsPerChar.toFixed(2)) +
        row('Total entropy', `${totalBits.toFixed(1)} bits`) +
        row('Shannon entropy', `${(shannon * len).toFixed(1)} bits`) +
        row('Combinations', combinations > 1e15 ? `~10^${Math.floor(Math.log10(combinations))}` : combinations.toLocaleString());

      const scenarios = [
        ['Online (1k/s)',       1e3],
        ['Offline MD5 (1B/s)',  1e9],
        ['GPU cluster (1T/s)',  1e12],
        ['Nation-state (1P/s)', 1e15],
      ];

      crack.innerHTML = scenarios.map(([label, rate]) => {
        const s = combinations / rate;
        const color = s > 3.15e7 ? 'var(--success)' : s > 3600 ? 'var(--warning)' : 'var(--error)';
        return row(label, formatTime(s), color);
      }).join('');
    }

    input.addEventListener('input', compute);
    pool.addEventListener('input', compute);
  }
});

})();
