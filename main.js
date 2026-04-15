const fs = require('fs');
const fetchFn = globalThis.fetch ?? require('node-fetch');
const { Readable } = require('stream');
const net = require('net');

const downloadFile = (async (url, path) => {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);

  const bodyStream = (res.body && typeof res.body.pipe === "function")
    ? res.body
    : (res.body ? Readable.fromWeb(res.body) : null);

  if (bodyStream) {
    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
      bodyStream.on("error", reject);
      fileStream.on("error", reject);
      fileStream.on("finish", resolve);
      bodyStream.pipe(fileStream);
    });
    return;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path, buf);
});

function extractIpFromAddress(addr) {
  if (!addr || typeof addr !== "string") return null;
  const trimmed = addr.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("[")) {
    const close = trimmed.indexOf("]");
    if (close === -1) return null;
    return trimmed.slice(1, close);
  }

  const idx = trimmed.lastIndexOf(":");
  if (idx === -1) return null;
  return trimmed.slice(0, idx);
}

async function main() {
  const tor_json = "./details.json";

  // Unfiltered Onionoo details (relays + bridges)
  await downloadFile("https://onionoo.torproject.org/details", tor_json);

  let rawdata = fs.readFileSync(tor_json);
  let data = JSON.parse(rawdata);
  const outputPath = "./output/";

  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

  const allNodes = []
    .concat(Array.isArray(data.relays) ? data.relays.map(n => ({ ...n, _type: "relay" })) : [])
    .concat(Array.isArray(data.bridges) ? data.bridges.map(n => ({ ...n, _type: "bridge" })) : []);

  let Node = [];

  allNodes.forEach(node => {
    const item = {
      type: node._type,
      nickname: node.nickname,
      asn: node.as,
      or_addresses: node.or_addresses,
      dir_address: node.dir_address,
      exit_addresses: node.exit_addresses
    }
    Node.push(item)
  })

  let ASN = [];

  allNodes.forEach(node => {
    if (ASN.indexOf(node.as) === -1) ASN.push(node.as);
  })

  let IPs = [];
  let IPsV4 = [];
  let IPsV6 = [];
  allNodes.forEach(node => {
    // OR addresses (all relays have these)
    if (Array.isArray(node.or_addresses)) {
      node.or_addresses.forEach(addr => {
        const ip = extractIpFromAddress(addr);
        const ver = ip ? net.isIP(ip) : 0;
        if (!ver) return;
        if (IPs.indexOf(ip) === -1) IPs.push(ip);
        if (ver === 4 && IPsV4.indexOf(ip) === -1) IPsV4.push(ip);
        if (ver === 6 && IPsV6.indexOf(ip) === -1) IPsV6.push(ip);
      });
    }

    // Directory address (some relays)
    if (node.dir_address) {
      const ip = extractIpFromAddress(node.dir_address);
      const ver = ip ? net.isIP(ip) : 0;
      if (ver) {
        if (IPs.indexOf(ip) === -1) IPs.push(ip);
        if (ver === 4 && IPsV4.indexOf(ip) === -1) IPsV4.push(ip);
        if (ver === 6 && IPsV6.indexOf(ip) === -1) IPsV6.push(ip);
      }
    }

    // Exit addresses (only exits)
    if (Array.isArray(node.exit_addresses)) {
      node.exit_addresses.forEach(ip => {
        const ver = ip ? net.isIP(ip) : 0;
        if (!ver) return;
        if (IPs.indexOf(ip) === -1) IPs.push(ip);
        if (ver === 4 && IPsV4.indexOf(ip) === -1) IPsV4.push(ip);
        if (ver === 6 && IPsV6.indexOf(ip) === -1) IPsV6.push(ip);
      });
    }
  });

  fs.writeFileSync(outputPath + "nodes.json", JSON.stringify(Node, null, 4));
  fs.writeFileSync(outputPath + "ASN.json", JSON.stringify(ASN, null, 4));
  fs.writeFileSync(outputPath + "ips.txt", IPsV4.join("\n"));
  fs.writeFileSync(outputPath + "ips.json", JSON.stringify(IPsV4, null, 2));
  fs.writeFileSync(outputPath + "ips_v6.txt", IPsV6.join("\n"));
  fs.writeFileSync(outputPath + "ips_v6.json", JSON.stringify(IPsV6, null, 2));
}

main()


