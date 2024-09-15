import * as Blockly from "blockly";
import { toolboxCategories, createPlayground } from "@blockly/dev-tools";
import { MultiselectPlugin, OptionsMgr } from "../../src/index";

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
            // comment: false,
        },
    });
    const workspace = Blockly.inject(blocklyDiv, options);
    const plugin = new MultiselectPlugin(workspace);
    plugin.init();

    return workspace;
}

// Triggers the call to createWorkspace
document.addEventListener("DOMContentLoaded", function () {
    const defaultOptions = {
        toolbox: toolboxCategories,
    };
    const blocklyDiv = document.getElementById("blocklyDiv");
    if (blocklyDiv) {
        createPlayground(blocklyDiv, createWorkspace, defaultOptions);
    }
});
