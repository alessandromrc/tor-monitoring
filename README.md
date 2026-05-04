# Tor Monitoring

This repository provides live Tor network data through simple HTTPS endpoints.  
The data is automatically updated every hour and stored in the `output` branch.

## Using this list on your MikroTik

You can use the following script to fetch the blocklist and add its IPs to the tor_ipv4  address list, allowing you to block traffic to and from known TOR related hosts.

```rsc
:local name "[tor-monitoring]"
:local url "https://raw.githubusercontent.com/alessandromrc/tor-monitoring/output/ips_v4.rsc"
:local fileName "tor-ips_v4.rsc"

:log info "$name fetch blocklist from $url"

/tool fetch url="$url" mode=https dst-path=$fileName idle-timeout="30s"

:if ([:len [/file find name=$fileName]] > 0) do={

    :log info "removing old ipv4 TOR list"
    /ip/firewall/address-list/remove [find where list="TOR"]

    :delay 2s

    :log info "$name import:start"

    :do {
        /import file-name=$fileName verbose=yes
    } on-error={
        :log warning "$name import completed with some duplicate entries"
    }

    :log info "$name import:done"

} else={
    :log error "$name failed to fetch the blocklist"
}
```

---

## Data Endpoints

| Data Type | URL |
| ---------- | --- |
| **ASNs** | https://alessandromrc.github.io/tor-monitoring/ASN.json |
| **Nodes** | https://alessandromrc.github.io/tor-monitoring/nodes.json |
| **IPs** | https://alessandromrc.github.io/tor-monitoring/ips.txt |
| **IPs JSON** | https://alessandromrc.github.io/tor-monitoring/ips.json |

---

## How it works

- The data is fetched and processed automatically every hour.
- Updated JSON files are pushed to the [`output`](https://github.com/alessandromrc/tor-monitoring/tree/output) branch.
- The files are then served through GitHub Pages for direct HTTPS access.

---
