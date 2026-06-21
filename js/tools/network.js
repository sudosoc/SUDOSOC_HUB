'use strict';
(function() {

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// IP to 32-bit int and back
function ip2int(ip){ return ip.split('.').reduce((s,o)=>(s<<8)+parseInt(o,10),0)>>>0; }
function int2ip(n){ return [n>>>24&255,n>>>16&255,n>>>8&255,n&255].join('.'); }
function validateIPv4(ip){ return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)&&ip.split('.').every(o=>parseInt(o)<=255); }

// ──────────────────────────────────────────────
// CIDR CALCULATOR
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'cidr',
  name: 'CIDR Calculator',
  category: 'networking',
  description: 'Calculate network address, broadcast, host range, and total hosts from CIDR notation.',
  tags: ['cidr','subnet','network','ip','mask','broadcast','range','hosts','ipv4'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="cidrInput">CIDR Notation</label>
          <input type="text" class="tool-input font-mono" id="cidrInput" placeholder="192.168.1.0/24">
        </div>
        <div style="display:flex;align-items:flex-end">
          <button class="btn btn-primary" id="cidrCalc" style="width:100%">Calculate</button>
        </div>
      </div>
      <div id="cidrResult" style="margin-top:var(--sp-5);display:none">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-4)">
          <div class="code-block" style="padding:var(--sp-5)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-4)">Network Details</div>
            <div id="cidrDetails" style="display:flex;flex-direction:column;gap:var(--sp-3);font-family:var(--font-mono);font-size:13px"></div>
          </div>
          <div class="code-block" style="padding:var(--sp-5)">
            <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-4)">Subnetting Info</div>
            <div id="cidrSubnets" style="display:flex;flex-direction:column;gap:var(--sp-3);font-family:var(--font-mono);font-size:13px"></div>
          </div>
        </div>
        <div id="cidrRangeNote" class="info-box info" style="margin-top:var(--sp-4)">
          <span class="info-box-icon">ℹ</span><span id="cidrRangeText"></span>
        </div>
      </div>
    </div>`;
  },
  init() {
    const input  = document.getElementById('cidrInput');
    const result = document.getElementById('cidrResult');
    const details = document.getElementById('cidrDetails');
    const subnets = document.getElementById('cidrSubnets');
    const rangeText = document.getElementById('cidrRangeText');

    function row(label, value) {
      return `<div style="display:flex;justify-content:space-between;gap:12px">
        <span style="color:var(--text-3);white-space:nowrap">${esc(label)}</span>
        <span style="color:var(--text);text-align:right;word-break:break-all">${esc(value)}</span>
      </div>`;
    }

    document.getElementById('cidrCalc').addEventListener('click', () => {
      const val = input.value.trim();
      if (!/^[\d.]+\/\d+$/.test(val)) { Toast.error('Invalid CIDR notation (e.g. 192.168.1.0/24)'); return; }
      const [ipStr, prefix] = val.split('/');
      const pfx = parseInt(prefix);
      if (!validateIPv4(ipStr) || pfx < 0 || pfx > 32) { Toast.error('Invalid IP or prefix length'); return; }

      const mask     = pfx === 0 ? 0 : (0xFFFFFFFF << (32 - pfx)) >>> 0;
      const network  = (ip2int(ipStr) & mask) >>> 0;
      const bcast    = (network | ~mask) >>> 0;
      const firstH   = pfx >= 31 ? network : network + 1;
      const lastH    = pfx >= 31 ? bcast   : bcast - 1;
      const hosts    = pfx >= 31 ? Math.pow(2, 32 - pfx) : Math.pow(2, 32 - pfx) - 2;
      const wildcard = int2ip(~mask >>> 0);

      const maskBin = mask.toString(2).padStart(32,'0')
        .replace(/(.{8})/g,'$1.').slice(0,-1);

      details.innerHTML =
        row('IP Address',      ipStr) +
        row('Network',         int2ip(network)) +
        row('Broadcast',       int2ip(bcast)) +
        row('Subnet Mask',     int2ip(mask)) +
        row('Wildcard Mask',   wildcard) +
        row('Prefix Length',   '/' + pfx) +
        row('Total Hosts',     Math.pow(2, 32 - pfx).toLocaleString()) +
        row('Usable Hosts',    hosts > 0 ? hosts.toLocaleString() : '0') +
        row('First Host',      pfx < 32 ? int2ip(firstH) : 'N/A') +
        row('Last Host',       pfx < 32 ? int2ip(lastH)  : 'N/A') +
        row('Mask (binary)',   maskBin);

      const classes = pfx <= 8 ? 'Class A' : pfx <= 16 ? 'Class B' : pfx <= 24 ? 'Class C' : 'Classless';
      const isPriv = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ipStr);
      const isLink = /^169\.254\./.test(ipStr);
      const isLoop = /^127\./.test(ipStr);

      subnets.innerHTML =
        row('Class',           classes) +
        row('Private Range',   isPriv ? 'Yes (RFC1918)' : 'No (Public)') +
        row('Loopback',        isLoop ? 'Yes' : 'No') +
        row('Link-Local',      isLink ? 'Yes' : 'No') +
        row('/16 subnets',     pfx <= 16 ? Math.pow(2, 16 - pfx).toLocaleString() + ' /16 blocks' : 'N/A') +
        row('/24 subnets',     pfx <= 24 ? Math.pow(2, 24 - pfx).toLocaleString() + ' /24 blocks' : 'N/A') +
        row('/28 subnets',     pfx <= 28 ? Math.pow(2, 28 - pfx).toLocaleString() + ' /28 blocks' : 'N/A') +
        row('/30 subnets',     pfx <= 30 ? Math.pow(2, 30 - pfx).toLocaleString() + ' /30 blocks' : 'N/A');

      rangeText.textContent = `Host range: ${int2ip(firstH)} — ${int2ip(lastH)} (${hosts.toLocaleString()} usable hosts)`;
      result.style.display = 'block';
    });

    input.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('cidrCalc').click(); });
  }
});

// ──────────────────────────────────────────────
// IPV4 CALCULATOR (Subnet from IP + Mask)
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'ipv4-calc',
  name: 'IPv4 Calculator',
  category: 'networking',
  description: 'Calculate subnet information from an IP address and subnet mask.',
  tags: ['ipv4','subnet','mask','network','broadcast','ip calculator','classful'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="ip4Addr">IP Address</label>
          <input type="text" class="tool-input font-mono" id="ip4Addr" placeholder="10.0.0.1">
        </div>
        <div class="tool-field">
          <label class="tool-label" for="ip4Mask">Subnet Mask</label>
          <input type="text" class="tool-input font-mono" id="ip4Mask" placeholder="255.255.255.0">
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="ip4Calc">Calculate</button>
      </div>
      <div id="ip4Result" style="margin-top:var(--sp-4);display:none">
        <div class="code-block" style="padding:var(--sp-5)">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-4)">IPv4 Subnet Result</div>
          <div id="ip4Details" style="display:flex;flex-direction:column;gap:var(--sp-3);font-family:var(--font-mono);font-size:13px"></div>
        </div>
      </div>
    </div>`;
  },
  init() {
    function maskToCidr(mask) {
      return ip2int(mask).toString(2).split('').filter(b=>b==='1').length;
    }
    function row(l,v){ return `<div style="display:flex;justify-content:space-between"><span style="color:var(--text-3)">${esc(l)}</span><span style="color:var(--text);font-family:var(--font-mono)">${esc(v)}</span></div>`; }

    document.getElementById('ip4Calc').addEventListener('click', () => {
      const ip   = document.getElementById('ip4Addr').value.trim();
      const mask = document.getElementById('ip4Mask').value.trim();
      if (!validateIPv4(ip))   { Toast.error('Invalid IP address'); return; }
      if (!validateIPv4(mask)) { Toast.error('Invalid subnet mask'); return; }

      const pfx   = maskToCidr(mask);
      const mInt  = ip2int(mask);
      const iInt  = ip2int(ip);
      const net   = (iInt & mInt)>>>0;
      const bc    = (net | ~mInt)>>>0;
      const hosts = Math.max(0, Math.pow(2, 32 - pfx) - 2);

      document.getElementById('ip4Details').innerHTML =
        row('IP Address',  ip) +
        row('Subnet Mask', mask) +
        row('CIDR',        '/' + pfx) +
        row('Network',     int2ip(net)) +
        row('Broadcast',   int2ip(bc)) +
        row('First Host',  int2ip(net+1)) +
        row('Last Host',   int2ip(bc-1)) +
        row('Usable Hosts',hosts.toLocaleString());
      document.getElementById('ip4Result').style.display='block';
    });
  }
});

// ──────────────────────────────────────────────
// IPV6 CALCULATOR
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'ipv6-calc',
  name: 'IPv6 Calculator',
  category: 'networking',
  description: 'Expand compressed IPv6 addresses, display full form, and analyze address type.',
  tags: ['ipv6','expand','compress','full','short','address','network','ip6'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <label class="tool-label" for="ip6Input">IPv6 Address</label>
        <input type="text" class="tool-input font-mono" id="ip6Input" placeholder="2001:db8::1 or fe80::1%eth0">
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="ip6Analyze">Analyze</button>
        <button class="btn btn-secondary" id="ip6Expand">Expand</button>
        <button class="btn btn-ghost btn-icon" id="ip6Copy" title="Copy full">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
      <div id="ip6Result" style="margin-top:var(--sp-4);display:none">
        <div class="code-block" style="padding:var(--sp-5)">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-4)">IPv6 Analysis</div>
          <div id="ip6Details" style="display:flex;flex-direction:column;gap:var(--sp-3);font-family:var(--font-mono);font-size:13px"></div>
        </div>
      </div>
    </div>`;
  },
  init() {
    const input   = document.getElementById('ip6Input');
    const result  = document.getElementById('ip6Result');
    const details = document.getElementById('ip6Details');
    let fullAddr  = '';

    function expandIPv6(addr) {
      addr = addr.split('%')[0]; // remove zone ID
      if (addr.includes('::')) {
        const sides = addr.split('::');
        const left  = sides[0] ? sides[0].split(':') : [];
        const right = sides[1] ? sides[1].split(':') : [];
        const missing = 8 - left.length - right.length;
        const groups = [...left, ...Array(missing).fill('0'), ...right];
        return groups.map(g=>g.padStart(4,'0')).join(':');
      }
      return addr.split(':').map(g=>g.padStart(4,'0')).join(':');
    }

    function compressIPv6(full) {
      let groups = full.split(':').map(g => parseInt(g,16).toString(16));
      let best = {start:-1,len:0}, cur = {start:-1,len:0};
      groups.forEach((g,i) => {
        if (g==='0') { if(cur.start===-1)cur.start=i; cur.len++; if(cur.len>best.len)best={...cur}; }
        else cur={start:-1,len:0};
      });
      if (best.len>1) groups.splice(best.start,best.len,'');
      let str = groups.join(':');
      if (str.startsWith(':')) str=':'+str;
      if (str.endsWith(':')) str+=':';
      return str;
    }

    function row(l,v){return `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:var(--text-3);white-space:nowrap">${esc(l)}</span><span style="color:var(--text);word-break:break-all;text-align:right">${esc(v)}</span></div>`;}

    function analyze() {
      const raw = input.value.trim();
      if (!raw) return;
      try {
        fullAddr = expandIPv6(raw);
        const type =
          fullAddr === '0000:0000:0000:0000:0000:0000:0000:0001' ? 'Loopback (::1)' :
          fullAddr === '0000:0000:0000:0000:0000:0000:0000:0000' ? 'Unspecified (::)' :
          fullAddr.startsWith('fe80') ? 'Link-Local' :
          fullAddr.startsWith('fc') || fullAddr.startsWith('fd') ? 'Unique Local (ULA)' :
          fullAddr.startsWith('ff') ? 'Multicast' :
          fullAddr.startsWith('2002') ? '6to4 Tunnel' :
          fullAddr.startsWith('2001:0db8') ? 'Documentation (TEST-NET)' :
          'Global Unicast';

        const groups = fullAddr.split(':').map(g=>parseInt(g,16));
        const prefix128 = groups.slice(0,4).map(g=>g.toString(16).padStart(4,'0')).join(':');

        details.innerHTML =
          row('Input',           raw) +
          row('Full (expanded)', fullAddr) +
          row('Compressed',      compressIPv6(fullAddr)) +
          row('Type',            type) +
          row('First /64',       prefix128+'::') +
          row('Scope',           fullAddr.startsWith('fe80')?'Link':'Global');

        result.style.display='block';
      } catch(e){ Toast.error('Invalid IPv6 address'); }
    }

    document.getElementById('ip6Analyze').addEventListener('click', analyze);
    document.getElementById('ip6Expand').addEventListener('click', () => {
      analyze();
      if (fullAddr) { input.value = fullAddr; }
    });
    document.getElementById('ip6Copy').addEventListener('click', () => {
      if (fullAddr) navigator.clipboard.writeText(fullAddr).then(()=>Toast.success('Copied'));
    });
    input.addEventListener('keydown', e => { if(e.key==='Enter') analyze(); });
  }
});

// ──────────────────────────────────────────────
// PORT REFERENCE TOOL
// ──────────────────────────────────────────────
const PORTS = [
  [20,'TCP','FTP Data','File Transfer Protocol — data channel'],
  [21,'TCP','FTP Control','File Transfer Protocol — command channel'],
  [22,'TCP','SSH','Secure Shell — encrypted remote access'],
  [23,'TCP','Telnet','Unencrypted remote shell (insecure)'],
  [25,'TCP','SMTP','Simple Mail Transfer Protocol'],
  [53,'TCP/UDP','DNS','Domain Name System'],
  [67,'UDP','DHCP Server','Dynamic Host Configuration Protocol'],
  [68,'UDP','DHCP Client','DHCP client requests'],
  [69,'UDP','TFTP','Trivial File Transfer Protocol'],
  [80,'TCP','HTTP','HyperText Transfer Protocol (unencrypted)'],
  [110,'TCP','POP3','Post Office Protocol v3 — email retrieval'],
  [111,'TCP/UDP','RPC','Remote Procedure Call (portmapper)'],
  [119,'TCP','NNTP','Network News Transfer Protocol'],
  [123,'UDP','NTP','Network Time Protocol'],
  [135,'TCP','MS-RPC','Microsoft Remote Procedure Call'],
  [137,'UDP','NetBIOS-NS','NetBIOS Name Service'],
  [138,'UDP','NetBIOS-DG','NetBIOS Datagram Service'],
  [139,'TCP','NetBIOS-SS','NetBIOS Session Service'],
  [143,'TCP','IMAP','Internet Message Access Protocol'],
  [161,'UDP','SNMP','Simple Network Management Protocol'],
  [162,'UDP','SNMP Trap','SNMP trap receiver'],
  [179,'TCP','BGP','Border Gateway Protocol'],
  [389,'TCP','LDAP','Lightweight Directory Access Protocol'],
  [443,'TCP','HTTPS','HTTP over TLS/SSL'],
  [445,'TCP','SMB','Server Message Block (Windows file sharing)'],
  [465,'TCP','SMTPS','SMTP over TLS (deprecated, use 587)'],
  [500,'UDP','IKE','Internet Key Exchange (IPsec VPN)'],
  [514,'UDP','Syslog','System logging protocol'],
  [515,'TCP','LPD','Line Printer Daemon'],
  [587,'TCP','SMTP/TLS','SMTP with STARTTLS (mail submission)'],
  [636,'TCP','LDAPS','LDAP over TLS/SSL'],
  [993,'TCP','IMAPS','IMAP over TLS/SSL'],
  [995,'TCP','POP3S','POP3 over TLS/SSL'],
  [1194,'UDP','OpenVPN','OpenVPN'],
  [1433,'TCP','MSSQL','Microsoft SQL Server'],
  [1434,'UDP','MSSQL Monitor','SQL Server Browser'],
  [1521,'TCP','Oracle DB','Oracle Database listener'],
  [1723,'TCP','PPTP','Point-to-Point Tunneling Protocol'],
  [2049,'TCP/UDP','NFS','Network File System'],
  [2375,'TCP','Docker','Docker daemon (UNSECURED — no TLS)'],
  [2376,'TCP','Docker TLS','Docker daemon with TLS'],
  [3306,'TCP','MySQL','MySQL database'],
  [3389,'TCP','RDP','Remote Desktop Protocol'],
  [4444,'TCP','Metasploit','Metasploit default reverse shell'],
  [5432,'TCP','PostgreSQL','PostgreSQL database'],
  [5900,'TCP','VNC','Virtual Network Computing'],
  [5985,'TCP','WinRM HTTP','Windows Remote Management'],
  [5986,'TCP','WinRM HTTPS','Windows Remote Management over TLS'],
  [6379,'TCP','Redis','Redis key-value store (no auth by default!)'],
  [6443,'TCP','Kubernetes API','Kubernetes API server'],
  [8080,'TCP','HTTP Alt','Alternative HTTP / proxy'],
  [8443,'TCP','HTTPS Alt','Alternative HTTPS'],
  [8888,'TCP','Jupyter','Jupyter Notebook default'],
  [9200,'TCP','Elasticsearch','Elasticsearch REST API'],
  [9300,'TCP','Elasticsearch','Elasticsearch transport'],
  [27017,'TCP','MongoDB','MongoDB database'],
  [27018,'TCP','MongoDB','MongoDB shard server'],
  [50000,'TCP','SAP','SAP application server'],
];

ToolRegistry.push({
  id: 'port-reference',
  name: 'Port Reference Tool',
  category: 'networking',
  description: 'Quick reference for common TCP/UDP ports, services, and security notes.',
  tags: ['port','reference','service','tcp','udp','network','well-known','lookup'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-field">
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" class="search-input" id="portSearch" placeholder="Search port number, service name, or protocol..." style="height:40px;font-size:13px">
        </div>
      </div>
      <div class="table-wrap" style="margin-top:var(--sp-4);max-height:520px">
        <table class="tool-table" id="portTable">
          <thead><tr>
            <th style="width:70px">Port</th>
            <th style="width:90px">Protocol</th>
            <th style="width:140px">Service</th>
            <th>Description</th>
          </tr></thead>
          <tbody id="portBody"></tbody>
        </table>
      </div>
      <div style="font-size:11px;color:var(--text-3);margin-top:var(--sp-2);font-family:var(--font-mono)" id="portCount">${PORTS.length} ports listed</div>
    </div>`;
  },
  init() {
    const body  = document.getElementById('portBody');
    const count = document.getElementById('portCount');
    const search = document.getElementById('portSearch');

    function render(data) {
      body.innerHTML = data.map(([port, proto, service, desc]) =>
        `<tr>
          <td style="font-family:var(--font-mono);color:var(--info)">${port}</td>
          <td>${esc(proto)}</td>
          <td style="font-weight:600;color:var(--text)">${esc(service)}</td>
          <td style="color:var(--text-2)">${esc(desc)}</td>
        </tr>`
      ).join('');
      count.textContent = `${data.length} of ${PORTS.length} ports shown`;
    }

    render(PORTS);

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      if (!q) { render(PORTS); return; }
      const filtered = PORTS.filter(([port,proto,service,desc]) =>
        port.toString().includes(q) ||
        service.toLowerCase().includes(q) ||
        proto.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
      render(filtered);
    });
  }
});

// ──────────────────────────────────────────────
// SUBNET CALCULATOR (Visual)
// ──────────────────────────────────────────────
ToolRegistry.push({
  id: 'subnet-calc',
  name: 'Subnet Calculator',
  category: 'networking',
  description: 'Split a network into subnets and calculate host ranges for each.',
  tags: ['subnet','subnetting','split','network','hosts','vlsm','plan'],
  render() {
    return `
    <div class="tool-body">
      <div class="tool-row">
        <div class="tool-field">
          <label class="tool-label" for="scNetwork">Base Network (CIDR)</label>
          <input type="text" class="tool-input font-mono" id="scNetwork" placeholder="10.0.0.0/8">
        </div>
        <div class="tool-field">
          <label class="tool-label" for="scNewPrefix">New Subnet Prefix</label>
          <input type="number" class="tool-input" id="scNewPrefix" placeholder="24" min="1" max="32">
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" id="scCalc">Calculate Subnets</button>
      </div>
      <div id="scResult" style="margin-top:var(--sp-4);display:none"></div>
    </div>`;
  },
  init() {
    document.getElementById('scCalc').addEventListener('click', () => {
      const netInput = document.getElementById('scNetwork').value.trim();
      const newPfx   = parseInt(document.getElementById('scNewPrefix').value);

      if (!/^[\d.]+\/\d+$/.test(netInput)) { Toast.error('Invalid CIDR'); return; }
      const [ipStr, prefix] = netInput.split('/');
      const pfx = parseInt(prefix);
      if (newPfx <= pfx || newPfx > 32) { Toast.error(`New prefix must be /${pfx+1} to /32`); return; }

      const subnetCount = Math.pow(2, newPfx - pfx);
      const hostsPerSubnet = Math.max(0, Math.pow(2, 32 - newPfx) - 2);
      const baseNet = (ip2int(ipStr) & ((0xFFFFFFFF << (32 - pfx)) >>> 0)) >>> 0;
      const mask = (0xFFFFFFFF << (32 - newPfx)) >>> 0;

      const maxShow = Math.min(subnetCount, 256);
      const rows = Array.from({length: maxShow}, (_, i) => {
        const net = (baseNet + i * Math.pow(2, 32 - newPfx)) >>> 0;
        const bc  = (net | ~mask) >>> 0;
        return `<tr>
          <td style="color:var(--info)">${i+1}</td>
          <td>${esc(int2ip(net))}/${newPfx}</td>
          <td>${esc(int2ip(net+1))}</td>
          <td>${esc(int2ip(bc-1))}</td>
          <td>${esc(int2ip(bc))}</td>
        </tr>`;
      }).join('');

      document.getElementById('scResult').innerHTML = `
        <div class="info-box info" style="margin-bottom:var(--sp-4)">
          <span class="info-box-icon">ℹ</span>
          <span>${subnetCount.toLocaleString()} subnets of /${newPfx} · ${hostsPerSubnet.toLocaleString()} usable hosts each${subnetCount > 256 ? ` · Showing first 256` : ''}</span>
        </div>
        <div class="table-wrap" style="max-height:420px">
          <table class="tool-table">
            <thead><tr><th>#</th><th>Network</th><th>First Host</th><th>Last Host</th><th>Broadcast</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      document.getElementById('scResult').style.display='block';
    });
  }
});

})();
