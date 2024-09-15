import * as Blockly from "blockly";
import { toolboxCategories } from "@blockly/dev-tools";
import { MultiselectPlugin, OptionsMgr } from "../../src/index";
// import "@rshaker/info-ptr";

function createWorkspace(blocklyDiv: HTMLElement, options: Blockly.BlocklyOptions): Blockly.WorkspaceSvg {
    const optionsMgr = OptionsMgr.getInstance()
    optionsMgr.setOptions({
        copyPasteToStorage: true,
        copyPasteToClipboard: true,
        hideDisabledMenuItems: false,
        enableBlockMenu: true,
        blockScope: {
            // movable: true,
        },
        enableWorkspaceMenu: true,
        workspaceScope: {
            // select: false,
        },
        multiselectScope: {
            // redo: true,
        },
    });
    const workspace = Blockly.inject(blocklyDiv, options); // hardcoded blocklyDiv
    const plugin = new MultiselectPlugin(workspace);
    window.MultiselectPlugin = plugin;
    plugin.init();

    return workspace;
}

document.addEventListener("DOMContentLoaded", function () {
    const blocklyDiv = document.getElementById("blocklyDiv");
    if (blocklyDiv) {
        createWorkspace(blocklyDiv, {
            toolbox: toolboxCategories,
        });
    }
});
