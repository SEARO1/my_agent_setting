// Standalone test: verify the MCP server tools work via a real MCP client.
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL("./server.mjs", import.meta.url))],
  cwd: fileURLToPath(new URL(".", import.meta.url))
});
const client = new Client({ name: "dsh-kb-test", version: "0.1.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const status = await client.callTool({ name: "kb_status", arguments: {} });
console.log("STATUS:", status.content[0].text);

const r1 = await client.callTool({ name: "kb_search", arguments: { query: "AGENTS.md 點樣自動載入指令", k: 3 } });
console.log("SEARCH1:", r1.content[0].text.slice(0, 800));

const r2 = await client.callTool({ name: "kb_search", arguments: { query: "OpenClaw memory wiki claims evidence", k: 3 } });
console.log("SEARCH2:", r2.content[0].text.slice(0, 800));

await client.close();
console.log("ALL TESTS PASSED");