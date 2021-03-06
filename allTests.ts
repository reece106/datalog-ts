import { runSuites } from "./testing";
import { unifyTests } from "./unifyTests";
import { parserTests } from "./parserTest";
import { replTests } from "./replTests";
import { fpTests } from "./fp/ddTests";
import { json2DLTests } from "./util/json2dlTest";
import { prettyPrintTests } from "./prettyTest";
import { treeTests } from "./treeTest";
import { actionsTests } from "./uiCommon/ide/actionsTest";
import { parserlibTests } from "./parserlib/ddTests";

// TODO: use a real arg parser
const flags = new Set(process.argv.slice(2));
const writeResults = flags.has("--write-results");
const stayAlive = flags.has("--stay-alive");

const suites = {
  unifyTests,
  parserTests,
  replTests: replTests(writeResults),
  fpTests: fpTests(writeResults),
  json2DLTests,
  prettyPrintTests,
  treeTests,
  actionsTests,
  parserlibTests: parserlibTests(writeResults),
};

try {
  runSuites(suites);
} catch (e) {
  console.error(e);
  if (!stayAlive) {
    console.log("exiting");
    process.exit(-1);
  }
}

if (stayAlive) {
  console.log("keeping VM alive for inspector...");
  setInterval(() => {}, 100);
}
