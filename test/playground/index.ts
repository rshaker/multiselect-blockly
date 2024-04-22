import * as Blockly from "blockly";
import { toolboxCategories, createPlayground } from "@blockly/dev-tools";
import { MultiselectPlugin, PluginFlags } from "../../src/index";

function createWorkspace(blocklyDiv: HTMLElement, options: Blockly.BlocklyOptions): Blockly.WorkspaceSvg {
    const pluginOptions: PluginFlags = {
        copyPasteToStorage: true, // Use local storage to persist copied blocks between sessions and across tabs
        copyPasteToClipboard: true, // `false` prevents use of system clipboard
        hideDisabledMenuItems: false, // `false` greys out disabled menu options, `true` hides them completely
        enableBlockMenu: true, // Adds a custom context menu for blocks (only when multiselect is active)
        blockScope: {
            // undo: true,
        },
        enableWorkspaceMenu: true, // Replaces Blockly's default workspace context menu
        workspaceScope: {
            // undo: true,
        },
        multiselectScope: {
            comment: false,
        },
    };

    const workspace = Blockly.inject(blocklyDiv, options);
    const plugin = new MultiselectPlugin(pluginOptions, workspace);
    plugin.init();

    return workspace;
}

document.addEventListener("DOMContentLoaded", function () {
    const defaultOptions = {
        toolbox: toolboxCategories,
    };
    const blocklyDiv = document.getElementById("blocklyDiv");
    if (blocklyDiv) {
        createPlayground(blocklyDiv, createWorkspace, defaultOptions);
    }
});
