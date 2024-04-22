import * as Blockly from "blockly";
import "@blockly/dev-tools"; // this is a kludge, to get the puppeteer tests to run
import { MultiselectPlugin, PluginFlags } from "../../src/index";

function createWorkspace(blocklyDiv: HTMLElement, options: Blockly.BlocklyOptions): Blockly.WorkspaceSvg {
    const pluginOptions: PluginFlags = {
        copyPasteToStorage: true, // Use local storage to persist copied blocks between sessions and across tabs
        copyPasteToClipboard: true, // `false` prevents use of system clipboard
        hideDisabledMenuItems: false, // `false` greys out disabled menu options, `true` hides them completely
        enableBlockMenu: true, // Adds a custom context menu for blocks (only when multiselect is active)
        blockScope: {
            // movable: true,
        },
        enableWorkspaceMenu: true, // Replaces Blockly's default workspace context menu (only when multiselect is inactive)
        workspaceScope: {
            // select: false,
        },
        multiselectScope: {
            // redo: true,
        },
    };

    const workspace = Blockly.inject(blocklyDiv, options); // hardcoded blocklyDiv
    const plugin = new MultiselectPlugin(pluginOptions, workspace);
    plugin.init();

    return workspace;
}

document.addEventListener("DOMContentLoaded", function () {
    const toolbox = {
        kind: "flyoutToolbox",
        contents: [
            {
                kind: "block",
                type: "controls_if",
            },
            {
                kind: "block",
                type: "controls_whileUntil",
            },
        ],
    };
    const blocklyDiv = document.getElementById("blocklyDiv");
    if (blocklyDiv) {
        createWorkspace(blocklyDiv, {
            toolbox: toolbox,
        });
    }
});
