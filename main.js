const fs = require('fs');
const fetch = require('node-fetch');

const downloadFile = (async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
});

async function main() {
  const tor_json = "./details.json";

  await downloadFile("https://onionoo.torproject.org/details?search=flag:exit", tor_json);


  let rawdata = fs.readFileSync(tor_json);
  let data = JSON.parse(rawdata);
  const outputPath = "./output/";

  let Node = [];

  data.relays.forEach(node => {
    const item = { nickname: node.nickname, exit_address: node.exit_addresses, asn: node.as }
    Node.push(item)
  })

  let ASN = [];

  data.relays.forEach(node => {
    if (ASN.indexOf(node.as) === -1) ASN.push(node.as);
  })

  let IPs = [];
  data.relays.forEach(node => {
    if (node.exit_addresses) {
      node.exit_addresses.forEach(ip => {
        if (IPs.indexOf(ip) === -1) IPs.push(ip);
      });
    }
  });

  fs.writeFileSync(outputPath + "nodes.json", JSON.stringify(Node, null, 4));
  fs.writeFileSync(outputPath + "ASN.json", JSON.stringify(ASN, null, 4));
  fs.writeFileSync(outputPath + "ips.txt", IPs.join("\n"));
  fs.writeFileSync(outputPath + "ips.json", JSON.stringify(IPs, null, 2));
}

main()


