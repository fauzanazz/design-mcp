import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGenerateDesign } from "./generate-design.js";
import { registerRefineDesign } from "./refine-design.js";
import { registerGetCreditStatus } from "./get-credit-status.js";
import { registerWhoami } from "./whoami.js";
import { registerCreateEditorSession } from "./create-editor-session.js";
import { registerLinkEditorSession } from "./link-editor-session.js";
import { registerUnlinkEditorSession } from "./unlink-editor-session.js";
import { registerListCanvases } from "./list-canvases.js";
import { registerGetCanvas } from "./get-canvas.js";
import { registerExtractCanvasDesign } from "./extract-canvas-design.js";
import { registerRateStyleDirection } from "./rate-style-direction.js";

export function registerAll(server: McpServer) {
  registerGenerateDesign(server);
  registerRefineDesign(server);
  registerGetCreditStatus(server);
  registerWhoami(server);
  registerCreateEditorSession(server);
  registerLinkEditorSession(server);
  registerUnlinkEditorSession(server);
  registerListCanvases(server);
  registerGetCanvas(server);
  registerExtractCanvasDesign(server);
  registerRateStyleDirection(server);
}
