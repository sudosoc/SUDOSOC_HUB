'use strict';
(function() {

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Pure-JS MD5 implementation
function md5(str) {
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff);
  }
  function bitRotate(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotate(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a,b,c,d,x,s,t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a,b,c,d,x,s,t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a,b,c,d,x,s,t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a,b,c,d,x,s,t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

  function str2binl(str) {
    const bin = [];
    const mask = (1 << 8) - 1;
    for (let i = 0; i < str.length * 8; i += 8)
      bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32);
    return bin;
  }
  function binl2hex(binarray) {
    const hexTab = '0123456789abcdef';
    let str = '';
    for (let i = 0; i < binarray.length * 4; i++) {
      str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
             hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
    }
    return str;
  }
  function binl_md5(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const oA=a,oB=b,oC=c,oD=d;
      a=md5ff(a,b,c,d,x[i],7,-680876936);d=md5ff(d,a,b,c,x[i+1],12,-389564586);c=md5ff(c,d,a,b,x[i+2],17,606105819);b=md5ff(b,c,d,a,x[i+3],22,-1044525330);
      a=md5ff(a,b,c,d,x[i+4],7,-176418897);d=md5ff(d,a,b,c,x[i+5],12,1200080426);c=md5ff(c,d,a,b,x[i+6],17,-1473231341);b=md5ff(b,c,d,a,x[i+7],22,-45705983);
      a=md5ff(a,b,c,d,x[i+8],7,1770035416);d=md5ff(d,a,b,c,x[i+9],12,-1958414417);c=md5ff(c,d,a,b,x[i+10],17,-42063);b=md5ff(b,c,d,a,x[i+11],22,-1990404162);
      a=md5ff(a,b,c,d,x[i+12],7,1804603682);d=md5ff(d,a,b,c,x[i+13],12,-40341101);c=md5ff(c,d,a,b,x[i+14],17,-1502002290);b=md5ff(b,c,d,a,x[i+15],22,1236535329);
      a=md5gg(a,b,c,d,x[i+1],5,-165796510);d=md5gg(d,a,b,c,x[i+6],9,-1069501632);c=md5gg(c,d,a,b,x[i+11],14,643717713);b=md5gg(b,c,d,a,x[i],20,-373897302);
      a=md5gg(a,b,c,d,x[i+5],5,-701558691);d=md5gg(d,a,b,c,x[i+10],9,38016083);c=md5gg(c,d,a,b,x[i+15],14,-660478335);b=md5gg(b,c,d,a,x[i+4],20,-405537848);
      a=md5gg(a,b,c,d,x[i+9],5,568446438);d=md5gg(d,a,b,c,x[i+14],9,-1019803690);c=md5gg(c,d,a,b,x[i+3],14,-187363961);b=md5gg(b,c,d,a,x[i+8],20,1163531501);
      a=md5gg(a,b,c,d,x[i+13],5,-1444681467);d=md5gg(d,a,b,c,x[i+2],9,-51403784);c=md5gg(c,d,a,b,x[i+7],14,1735328473);b=md5gg(b,c,d,a,x[i+12],20,-1926607734);
      a=md5hh(a,b,c,d,x[i+5],4,-378558);d=md5hh(d,a,b,c,x[i+8],11,-2022574463);c=md5hh(c,d,a,b,x[i+11],16,1839030562);b=md5hh(b,c,d,a,x[i+14],23,-35309556);
      a=md5hh(a,b,c,d,x[i+1],4,-1530992060);d=md5hh(d,a,b,c,x[i+4],11,1272893353);c=md5hh(c,d,a,b,x[i+7],16,-155497632);b=md5hh(b,c,d,a,x[i+10],23,-1094730640);
      a=md5hh(a,b,c,d,x[i+13],4,681279174);d=md5hh(d,a,b,c,x[i],11,-358537222);c=md5hh(c,d,a,b,x[i+3],16,-722521979);b=md5hh(b,c,d,a,x[i+6],23,76029189);
      a=md5hh(a,b,c,d,x[i+9],4,-640364487);d=md5hh(d,a,b,c,x[i+12],11,-421815835);c=md5hh(c,d,a,b,x[i+15],16,530742520);b=md5hh(b,c,d,a,x[i+2],23,-995338651);
      a=md5ii(a,b,c,d,x[i],6,-198630844);d=md5ii(d,a,b,c,x[i+7],10,1126891415);c=md5ii(c,d,a,b,x[i+14],15,-1416354905);b=md5ii(b,c,d,a,x[i+5],21,-57434055);
      a=md5ii(a,b,c,d,x[i+12],6,1700485571);d=md5ii(d,a,b,c,x[i+3],10,-1894986606);c=md5ii(c,d,a,b,x[i+10],15,-1051523);b=md5ii(b,c,d,a,x[i+1],21,-2054922799);
      a=md5ii(a,b,c,d,x[i+8],6,1873313359);d=md5ii(d,a,b,c,x[i+15],10,-30611744);c=md5ii(c,d,a,b,x[i+6],15,-1560198380);b=md5ii(b,c,d,a,x[i+13],21,1309151649);
      a=md5ii(a,b,c,d,x[i+4],6,-145523070);d=md5ii(d,a,b,c,x[i+11],10,-1120210379);c=md5ii(c,d,a,b,x[i+2],15,718787259);b=md5ii(b,c,d,a,x[i+9],21,-343485551);
      a=safeAdd(a,oA);b=safeAdd(b,oB);c=safeAdd(c,oC);d=safeAdd(d,oD);
    }
    return [a,b,c,d];
  }

  // Encode as UTF-8 Latin1 for MD5
  const utf8 = unescape(encodeURIComponent(str));
  return binl2hex(binl_md5(str2binl(utf8), utf8.length * 8));
}

// Web Crypto hash helper
async function webCryptoHash(algorithm, text) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(algorithm, enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// Shared hash tool renderer
function makeHashTool(id, name, algoLabel, hashFn) {
  return {
    id, name,
    category: 'hashing',
    description: `Compute the ${name} hash of any text input. Uses ${algoLabel === 'MD5' ? 'pure-JS implementation' : 'native Web Crypto API'}.`,
    tags: [id, algoLabel.toLowerCase(), 'hash', 'digest', 'checksum', 'integrity'],
    render() {
      return `
      <div class="tool-body">
        <div class="tool-field">
          <label class="tool-label" for="${id}Input">Input Text</label>
          <textarea class="tool-textarea" id="${id}Input" placeholder="Enter text to hash..." spellcheck="false"></textarea>
        </div>
        <div class="tool-actions">
          <button class="btn btn-primary" id="${id}Compute">Compute ${algoLabel}</button>
          <button class="btn btn-ghost btn-icon" id="${id}Copy" title="Copy hash">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button class="btn btn-ghost btn-icon" id="${id}Clear" title="Clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
        <div class="tool-field">
          <label class="tool-label" for="${id}Output">
            ${algoLabel} Hash
            <span class="tool-label-badge" id="${id}Len">—</span>
          </label>
          <input type="text" class="tool-input font-mono" id="${id}Output" readonly placeholder="Hash appears here...">
        </div>
        <div id="${id}Status" class="tool-status" style="margin-top:var(--sp-2)">
          <span class="tool-status-dot" id="${id}Dot"></span>
          <span id="${id}Msg" class="tool-status-msg">Ready</span>
        </div>
      </div>`;
    },
    init() {
      const inp = document.getElementById(`${id}Input`);
      const out = document.getElementById(`${id}Output`);
      const dot = document.getElementById(`${id}Dot`);
      const msg = document.getElementById(`${id}Msg`);
      const len = document.getElementById(`${id}Len`);

      async function compute() {
        const text = inp.value;
        if (!text) { out.value=''; dot.className='tool-status-dot'; msg.textContent='No input'; return; }
        dot.className = 'tool-status-dot warn';
        msg.textContent = 'Computing...';
        try {
          const hash = await hashFn(text);
          out.value = hash;
          len.textContent = `${hash.length * 4} bits`;
          dot.className = 'tool-status-dot ok';
          msg.textContent = `Hashed ${text.length} chars · ${hash.length} hex chars`;
        } catch(e) {
          out.value = '';
          dot.className = 'tool-status-dot error';
          msg.textContent = 'Error: ' + e.message;
        }
      }

      document.getElementById(`${id}Compute`).addEventListener('click', compute);
      document.getElementById(`${id}Copy`).addEventListener('click', () => {
        if (out.value) navigator.clipboard.writeText(out.value).then(() => Toast.success('Hash copied'));
      });
      document.getElementById(`${id}Clear`).addEventListener('click', () => {
        inp.value=''; out.value='';
        dot.className='tool-status-dot'; msg.textContent='Ready'; len.textContent='—';
      });

      // Live hash on input (debounced)
      let timer;
      inp.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(compute, 300);
      });
    }
  };
}

ToolRegistry.push(makeHashTool('md5',    'MD5 Hash',    'MD5',    text => Promise.resolve(md5(text))));
ToolRegistry.push(makeHashTool('sha1',   'SHA1 Hash',   'SHA1',   text => webCryptoHash('SHA-1', text)));
ToolRegistry.push(makeHashTool('sha256', 'SHA256 Hash', 'SHA256', text => webCryptoHash('SHA-256', text)));
ToolRegistry.push(makeHashTool('sha512', 'SHA512 Hash', 'SHA512', text => webCryptoHash('SHA-512', text)));

})();
