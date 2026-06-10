const SPREADSHEET_ID = "1GzToDiDVuLfDZ4Y67BABloyaldCgqv1zwtoT7UNJnYs";

const html = await fetch(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`).then((r) => r.text());
const tabs = [...html.matchAll(/items\.push\(\{name: "([^"]+)", pageUrl: "[^"]+gid=(\d+)"/g)].map((m) => ({
  name: m[1],
  gid: m[2],
}));
console.log("tabs:", tabs.map((t) => t.name).join(", "));

for (const name of ["801A名單", "座位表", "加分記錄"]) {
  const tab = tabs.find((t) => t.name === name);
  if (!tab) continue;
  const raw = await fetch(
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${tab.gid}`,
  ).then((r) => r.text());
  const json = JSON.parse(
    raw.replace(/^\/\*O_o\*\/\n/, "").replace(/^google\.visualization\.Query\.setResponse\(/, "").replace(/\);?\s*$/, ""),
  );
  console.log(`${name}: ${json.table.rows.length} rows`);
}
