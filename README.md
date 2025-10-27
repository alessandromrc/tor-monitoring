# Tor Monitoring

This repository provides live Tor network data through simple HTTPS endpoints.  
The data is automatically updated every hour and stored in the `output` branch.

---

## Data Endpoints

| Data Type | URL |
| ---------- | --- |
| **ASNs** | https://alessandromrc.github.io/tor-monitoring/ASN.json |
| **Nodes** | https://alessandromrc.github.io/tor-monitoring/nodes.json |

---

## How it works

- The data is fetched and processed automatically every hour.
- Updated JSON files are pushed to the [`output`](https://github.com/alessandromrc/tor-monitoring/tree/output) branch.
- The files are then served through GitHub Pages for direct HTTPS access.

---
