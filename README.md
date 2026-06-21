# >_ SUDOSOC TOOLBOX

A curated collection of cybersecurity tools and resources for analysts, defenders, and practitioners.  
Runs entirely in your browser — no data leaves your machine.

## Features

- **42+ Tools** across 7 categories
- **100% Browser-based** — no backend, no server, no API calls
- **Privacy First** — nothing is sent or stored externally
- **Dark mode by default** with light mode toggle
- **Responsive** — works on desktop and mobile
- **Fast** — vanilla JS, no frameworks, no CDN dependencies

## Tool Categories

| Category | Tools |
|---|---|
| Encoding & Decoding | Base64, URL Encode, HTML Encode, JWT Decoder, Unicode |
| Hashing | MD5, SHA1, SHA256, SHA512 |
| Password | Generator, Strength Checker, Entropy Calculator |
| JSON & Data | JSON Formatter, Validator, Minifier, XML Formatter, YAML Viewer |
| Networking | CIDR Calc, IPv4 Calc, IPv6 Calc, Subnet Calc, Port Reference |
| SOC & DFIR | IOC Extractor, IOC Defanger, Timestamp Converter, CVSS 3.1 Calc, Log Analyzer |
| Developer | UUID Generator, Regex Tester, Text Diff, Word Counter, Case Converter |

## Resources

- Linux Command Cheat Sheet
- Nmap Reference
- Wireshark Filters
- Incident Response Guide (NIST SP 800-61)
- SOC Analyst Notes & MITRE ATT&CK

## Hosting

Hosted on **Cloudflare Pages** connected to this GitHub repository.  
Every push to `main` triggers an automatic deployment.

### GitHub Pages (alternative)

Enable GitHub Pages in repository Settings → Pages → Source: GitHub Actions.  
The included workflow (`.github/workflows/deploy.yml`) handles deployment automatically.

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- Web Crypto API (SHA hashing)
- No frameworks, no build step, no dependencies

## License

MIT License — free to use, fork, and modify.
