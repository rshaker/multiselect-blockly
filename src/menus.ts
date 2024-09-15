import * as Blockly from "blockly/core";
import { MultiselectPlugin } from "./plugin";
import { BlockScope, WorkspaceScope, MultiScope } from "./options";
import * as api from "./api";
import { isNode } from "./util";
import { OptionsMgr } from "./options";

// Required for custom context menu options (e.g. sort)
export interface CustomContextMenuOption extends Blockly.ContextMenuRegistry.ContextMenuOption {
    sort?: string,
}

// Define a new scope type, then combine it with Blockly's built-in scopes
export interface CombinedScope extends Blockly.ContextMenuRegistry.Scope {
    multiselect?: Blockly.BlockSvg[];
    /**
     These are what's already defined in Blockly's `ContextMenuRegistry.Scope`:
        block?: BlockSvg;
        workspace?: WorkspaceSvg;
     */
}

export const MenuItemLabels = {
    cleanup_all: "Cleanup All",
    cleanup: "Cleanup",
    collapse_all: "Collapse all",
    collapse: "Collapse",
    comment: "Comment",
    copy: "Copy",
    delete_all: "Delete All",
    delete: "Delete",
    duplicate: "Duplicate",
    expand_all: "Expand all",
    expand: "Expand",
    external: "External",
    help: "Help",
    inline: "Inline",
    paste: "Paste",
    redo: "Redo",
    reset: "Reset",
    select_all: "Select all",
    set_deletable: "Set deletable",
    set_editable: "Set editable",
    set_movable: "Set movable",
    set_undeletable: "Set undeletable",
    set_uneditable: "Set uneditable",
    set_unmovable: "Set unmovable",
    uncomment: "Uncomment",
    undo: "Undo",
};

// Option menu items are grouped by weight, and groups are optionally separated by a <hr> element.
const weights: { [key: string]: number } = {};
weights[MenuItemLabels.cleanup] = 4;
weights[MenuItemLabels.cleanup_all] = 4;
weights[MenuItemLabels.comment] = 5;
weights[MenuItemLabels.uncomment] = 5;
weights[MenuItemLabels.copy] = 6;
weights[MenuItemLabels.paste] = 6;
weights[MenuItemLabels.delete] = 6;
weights[MenuItemLabels.delete_all] = 6;
weights[MenuItemLabels.duplicate] = 6;
weights[MenuItemLabels.collapse] = 7;
weights[MenuItemLabels.collapse_all] = 7;
weights[MenuItemLabels.expand] = 7;
weights[MenuItemLabels.expand_all] = 7;
weights[MenuItemLabels.external] = 8;
weights[MenuItemLabels.inline] = 8;
weights[MenuItemLabels.redo] = 9;
weights[MenuItemLabels.undo] = 9;
weights[MenuItemLabels.reset] = 10;
weights[MenuItemLabels.select_all] = 11;
weights[MenuItemLabels.set_deletable] = 12;
weights[MenuItemLabels.set_editable] = 12;
weights[MenuItemLabels.set_movable] = 12;
weights[MenuItemLabels.set_undeletable] = 12;
weights[MenuItemLabels.set_uneditable] = 12;
weights[MenuItemLabels.set_unmovable] = 12;
weights[MenuItemLabels.help] = 13;

// All context menus are managed by this plugin, except when they're punted to Blockly's default context menu
export function customShowContextMenu(plugin: MultiselectPlugin, e: Event, scope: CombinedScope): CustomContextMenuOption[] {
    const blockly = plugin.getBlockly();
    const pluginOptions = OptionsMgr.getInstance().getOptions();

    // const blockScopeType = blockly.ContextMenuRegistry.ScopeType.BLOCK;
    const workspaceScopeType = blockly.ContextMenuRegistry.ScopeType.WORKSPACE;
    let menuOptions: CustomContextMenuOption[] = [];

    if (scope.block) {
        if (pluginOptions.enableBlockMenu) {
            // Use our custom options for block context menu
            menuOptions = createMenuOptions(plugin, scope);
            blockly && blockly.ContextMenu.show(e, menuOptions, false);
        } else {
            // Use our custom options for multiselect context menu
            const blocks: Blockly.BlockSvg[] = []; // empty array may not work for all cases (none yet)
            scope = { multiselect: blocks };
            menuOptions = createMenuOptions(plugin, scope);
            blockly && blockly.ContextMenu.show(e, menuOptions, false);
        }
    } else if (scope.workspace) {
        if (pluginOptions.enableWorkspaceMenu) {
            // Use our custom options for workspace context menu
            menuOptions = createMenuOptions(plugin, scope);
            blockly && blockly.ContextMenu.show(e, menuOptions, false);
        } else {
            // Use Blockly's default options for workspace context menu
            menuOptions = blockly.ContextMenuRegistry.registry.getContextMenuOptions(workspaceScopeType, scope);
            if (menuOptions && menuOptions.length) {
                blockly && blockly.ContextMenu.show(e, menuOptions, scope.block.RTL);
            }
        }
    } else if (scope.multiselect) {
        // Multiselect mode has only one scope (vs single-select which has two)
        menuOptions = createMenuOptions(plugin, scope);
        blockly && blockly.ContextMenu.show(e, menuOptions, false);
    } else {
        throw new Error(`Encountered unknown scope ${scope}`);
    }

    return menuOptions;
}

export function createMenuOptions(plugin: MultiselectPlugin, scope: CombinedScope): CustomContextMenuOption[] {
    const pluginOptions = OptionsMgr.getInstance().getOptions();

    let scopedOptions: BlockScope | WorkspaceScope | MultiScope;

    // Determine which set of plugin options to use based on the scope
    if (scope.block) {
        scopedOptions = pluginOptions.blockScope ?? {};
    } else if (scope.workspace) {
        scopedOptions = pluginOptions.workspaceScope ?? {};
    } else if (scope.multiselect) {
        scopedOptions = pluginOptions.multiselectScope ?? {};
    }

    // Build the list of context menu options based on the plugin's options
    let menuOptions: CustomContextMenuOption[] = [];
    for (const [key, value] of Object.entries(scopedOptions)) {
        // Skip disabled options if `hideDisabledMenuItems` is true
        if (pluginOptions.hideDisabledMenuItems && !value) continue;
        menuOptions.push(...getOptions(plugin, scope, key));
    }

    // Sort menu options by weight and sort key
    menuOptions = menuOptions.sort((a, b) => {
        // First, compare by weight
        if (a.weight < b.weight) return -1;
        if (a.weight > b.weight) return 1;

        // If weights are equal, compare alphabetically by `.sort` key
        return a.sort.toString().localeCompare(b.sort.toString());
    });

    // Insert a separator between groups of menu entries at the point where their weights differ
    for (let i = menuOptions.length - 1; i > 0; i--) {
        if (menuOptions[i - 1].weight < menuOptions[i].weight) {
            menuOptions.splice(i, 0, {
                sort: "none", // never used
                text: getItemSeparator(),
                enabled: true,
                callback: () => { },
                scope: scope,
                weight: 0, // never used
            });
        }
    }

    return menuOptions;
}

function getItemSeparator(): HTMLElement {
    const htmlElement = document.createElement("hr");
    htmlElement.classList.add("ms-menuitem-separator");

    return htmlElement;
}

export function getItemText(name: string): HTMLElement | string {
    if (!isNode) {
        const htmlElement = document.createElement("span");
        htmlElement.classList.add("ms-menuitem");
        htmlElement.id = "ms-menuitem-" + name.toLowerCase().replace(/ /g, "-");
        htmlElement.innerText = name;
        return htmlElement;
    }

    return name;
}

export function getOptions(plugin: MultiselectPlugin, scope: CombinedScope, optionName: string): CustomContextMenuOption[] {
    // TODO: Rename all instances of `pluginFlags` to `pluginOptions` or something similar
    // const pluginFlags = plugin.getOptions();
    const optionsMgr = OptionsMgr.getInstance();
    const pluginFlags = optionsMgr.getOptions();
    const options: CustomContextMenuOption[] = [];

    if (scope.block) {
        switch (optionName) {
            case "comment":
                // Expected interface properties can be found here:
                // https://github.com/google/blockly/blob/71185b5582401cd499f0e4a8ed444e7c4d531580/core/contextmenu_registry.ts#L148
                options.push({
                    sort: MenuItemLabels.comment,
                    text: getItemText(MenuItemLabels.comment),
                    enabled: pluginFlags.blockScope.comment,
                    callback: () => {
                        api.doComment(plugin, scope.block.id, '');
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.comment],
                });
                options.push({
                    sort: MenuItemLabels.uncomment,
                    text: getItemText(MenuItemLabels.uncomment),
                    enabled: pluginFlags.blockScope.comment,
                    callback: () => {
                        api.doComment(plugin, scope.block.id, null);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.uncomment],
                });
                break;
            case "copy":
                options.push({
                    sort: MenuItemLabels.copy,
                    text: getItemText(MenuItemLabels.copy),
                    enabled: pluginFlags.blockScope.copy,
                    callback: () => {
                        api.doCopy(plugin, scope.block.id);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.copy],
                });
                break;
            case "deletable":
                options.push({
                    sort: MenuItemLabels.set_deletable,
                    text: getItemText(MenuItemLabels.set_deletable),
                    enabled: pluginFlags.blockScope.deletable,
                    callback: () => {
                        api.setDeletable(plugin, scope.block.id, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_deletable],
                });
                options.push({
                    sort: MenuItemLabels.set_undeletable,
                    text: getItemText(MenuItemLabels.set_undeletable),
                    enabled: pluginFlags.blockScope.deletable,
                    callback: () => {
                        api.setDeletable(plugin, scope.block.id, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_undeletable],
                });
                break;
            case "delete":
                options.push({
                    sort: MenuItemLabels.delete,
                    text: getItemText(MenuItemLabels.delete),
                    enabled: pluginFlags.blockScope.delete,
                    callback: () => {
                        api.doDelete(plugin, scope.block.id);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.delete],
                });
                break;
            case "duplicate":
                options.push({
                    sort: MenuItemLabels.duplicate,
                    text: getItemText(MenuItemLabels.duplicate),
                    enabled: pluginFlags.blockScope.duplicate,
                    callback: () => {
                        api.doDuplicate(plugin, scope.block.id);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.duplicate],
                });
                break;
            case "editable":
                options.push({
                    sort: MenuItemLabels.set_editable,
                    text: getItemText(MenuItemLabels.set_editable),
                    enabled: pluginFlags.blockScope.editable,
                    callback: () => {
                        api.setEditable(plugin, scope.block.id, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_editable],
                });
                options.push({
                    sort: MenuItemLabels.set_uneditable,
                    text: getItemText(MenuItemLabels.set_uneditable),
                    enabled: pluginFlags.blockScope.editable,
                    callback: () => {
                        api.setEditable(plugin, scope.block.id, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_uneditable],
                });
                break;
            case "expand":
                options.push({
                    sort: MenuItemLabels.collapse,
                    text: getItemText(MenuItemLabels.collapse),
                    enabled: pluginFlags.blockScope.expand,
                    callback: () => {
                        api.doCollapse(plugin, scope.block.id, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.collapse],
                });
                options.push({
                    sort: MenuItemLabels.expand,
                    text: getItemText(MenuItemLabels.expand),
                    enabled: pluginFlags.blockScope.expand,
                    callback: () => {
                        api.doCollapse(plugin, scope.block.id, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.expand],
                });
                break;
            case "help":
                options.push({
                    sort: MenuItemLabels.help,
                    text: getItemText(MenuItemLabels.help),
                    enabled: pluginFlags.blockScope.help,
                    callback: () => {
                        api.doHelp(plugin, scope.block.id);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.help],
                });
                break;
            case "inline":
                options.push({
                    sort: MenuItemLabels.inline,
                    text: getItemText(MenuItemLabels.inline),
                    enabled: pluginFlags.blockScope.inline,
                    callback: () => {
                        api.doInline(plugin, scope.block.id, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.inline],
                });
                options.push({
                    sort: MenuItemLabels.external,
                    text: getItemText(MenuItemLabels.external),
                    enabled: pluginFlags.blockScope.inline,
                    callback: () => {
                        api.doInline(plugin, scope.block.id, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.external],
                });
                break;
            case "movable":
                options.push({
                    sort: MenuItemLabels.set_movable,
                    text: getItemText(MenuItemLabels.set_movable),
                    enabled: pluginFlags.blockScope.movable,
                    callback: () => {
                        api.setMovable(plugin, scope.block.id, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_movable],
                });
                options.push({
                    sort: MenuItemLabels.set_unmovable,
                    text: getItemText(MenuItemLabels.set_unmovable),
                    enabled: pluginFlags.blockScope.movable,
                    callback: () => {
                        api.setMovable(plugin, scope.block.id, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_unmovable],
                });
                break;
            default:
                throw new Error(`Encountered unknown block flag key ${optionName}`);
        }
    } else if (scope.workspace) {
        switch (optionName) {
            case "cleanup":
                options.push({
                    sort: MenuItemLabels.cleanup_all,
                    text: getItemText(MenuItemLabels.cleanup_all),
                    enabled: pluginFlags.workspaceScope.cleanup,
                    callback: () => {
                        api.doCleanupAll(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.cleanup_all],
                });
                break;
            case "delete":
                options.push({
                    sort: MenuItemLabels.delete_all,
                    text: getItemText(MenuItemLabels.delete_all),
                    enabled: pluginFlags.workspaceScope.delete,
                    callback: () => {
                        api.doDeleteAll(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.delete_all],
                });
                break;
            case "expand":
                options.push({
                    sort: MenuItemLabels.expand_all,
                    text: getItemText(MenuItemLabels.expand_all),
                    enabled: pluginFlags.workspaceScope.expand,
                    callback: () => {
                        api.doCollapseAll(plugin, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.expand_all],
                });
                options.push({
                    sort: MenuItemLabels.collapse_all,
                    text: getItemText(MenuItemLabels.collapse_all),
                    enabled: true,
                    callback: () => {
                        api.doCollapseAll(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.collapse_all],
                });
                break;
            case "help":
                options.push({
                    sort: MenuItemLabels.help,
                    text: getItemText(MenuItemLabels.help),
                    enabled: pluginFlags.workspaceScope.help,
                    callback: () => {
                        api.doHelp(plugin, null);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.help],
                });
                break;
            case "paste":
                options.push({
                    sort: MenuItemLabels.paste,
                    text: getItemText(MenuItemLabels.paste),
                    enabled: pluginFlags.workspaceScope.paste,
                    callback: () => {
                        api.doPasteCopied(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.paste],
                });
                break;
            case "redo":
                options.push({
                    sort: MenuItemLabels.redo,
                    text: getItemText(MenuItemLabels.redo),
                    enabled: pluginFlags.workspaceScope.redo,
                    callback: () => {
                        api.doRedo(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.redo],
                });
                break;
            case "reset":
                options.push({
                    sort: MenuItemLabels.reset,
                    text: getItemText(MenuItemLabels.reset),
                    enabled: pluginFlags.workspaceScope.reset,
                    callback: () => {
                        api.doReset(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.reset],
                });
                break;
            case "select":
                options.push({
                    sort: MenuItemLabels.select_all,
                    text: getItemText(MenuItemLabels.select_all),
                    enabled: pluginFlags.workspaceScope.select,
                    callback: () => {
                        api.doSelectAll(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.select_all],
                });
                break;                
            case "undo":
                options.push({
                    sort: MenuItemLabels.undo,
                    text: getItemText(MenuItemLabels.undo),
                    enabled: pluginFlags.workspaceScope.undo,
                    callback: () => {
                        api.doUndo(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.undo],
                });
                break;
            default:
                throw new Error(`Encountered unknown workspace flag key ${optionName}`);
        }
    } else if (scope.multiselect) {
        switch (optionName) {
            case "cleanup":
                options.push({
                    sort: MenuItemLabels.cleanup,
                    text: getItemText(MenuItemLabels.cleanup),
                    enabled: pluginFlags.multiselectScope.cleanup,
                    callback: () => {
                        api.doCleanupSelected(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.cleanup],
                });
                break;
            case "comment":
                options.push({
                    sort: MenuItemLabels.comment,
                    text: getItemText(MenuItemLabels.comment),
                    enabled: pluginFlags.multiselectScope.comment,
                    callback: () => {
                        api.doCommentSelected(plugin, '');
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.comment],
                });
                options.push({
                    sort: MenuItemLabels.uncomment,
                    text: getItemText(MenuItemLabels.uncomment),
                    enabled: pluginFlags.multiselectScope.comment,
                    callback: () => {
                        api.doCommentSelected(plugin, null);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.uncomment],
                });
                break;
            case "copy":
                options.push({
                    sort: MenuItemLabels.copy,
                    text: getItemText(MenuItemLabels.copy),
                    enabled: pluginFlags.multiselectScope.copy,
                    callback: () => {
                        api.doCopySelected(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.copy],
                });
                break;
            case "duplicate":
                options.push({
                    sort: MenuItemLabels.duplicate,
                    text: getItemText(MenuItemLabels.duplicate),
                    enabled: pluginFlags.multiselectScope.duplicate,
                    callback: () => {
                        api.doDuplicateSelected(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.duplicate],
                });
                break;
            case "delete":
                options.push({
                    sort: MenuItemLabels.delete,
                    text: getItemText(MenuItemLabels.delete),
                    enabled: pluginFlags.multiselectScope.delete,
                    callback: () => {
                        api.doDeleteSelected(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.delete],
                });
                break;
            case "editable":
                options.push({
                    sort: MenuItemLabels.set_editable,
                    text: getItemText(MenuItemLabels.set_editable),
                    enabled: pluginFlags.multiselectScope.editable,
                    callback: () => {
                        api.setEditableSelected(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_editable],
                });
                options.push({
                    sort: MenuItemLabels.set_uneditable,
                    text: getItemText(MenuItemLabels.set_uneditable),
                    enabled: pluginFlags.multiselectScope.editable,
                    callback: () => {
                        api.setEditableSelected(plugin, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_uneditable],
                });
                break;
            case "expand":
                options.push({
                    sort: MenuItemLabels.expand,
                    text: getItemText(MenuItemLabels.expand),
                    enabled: pluginFlags.multiselectScope.expand,
                    callback: () => {
                        api.doCollapseSelected(plugin, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.expand],
                });
                options.push({
                    sort: MenuItemLabels.collapse,
                    text: getItemText(MenuItemLabels.collapse),
                    enabled: pluginFlags.multiselectScope.expand,
                    callback: () => {
                        api.doCollapseSelected(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.collapse],
                });
                break;
            case "deletable":
                options.push({
                    sort: MenuItemLabels.set_deletable,
                    text: getItemText(MenuItemLabels.set_deletable),
                    enabled: pluginFlags.multiselectScope.deletable,
                    callback: () => {
                        api.setDeletableSelected(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_deletable],
                });
                options.push({
                    sort: MenuItemLabels.set_undeletable,
                    text: getItemText(MenuItemLabels.set_undeletable),
                    enabled: pluginFlags.multiselectScope.deletable,
                    callback: () => {
                        api.setDeletableSelected(plugin, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_undeletable],
                });
                break;
            case "inline":
                options.push({
                    sort: MenuItemLabels.inline,
                    text: getItemText(MenuItemLabels.inline),
                    enabled: pluginFlags.multiselectScope.inline,
                    callback: () => {
                        api.doInlineSelected(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.inline],
                });
                options.push({
                    sort: MenuItemLabels.external,
                    text: getItemText(MenuItemLabels.external),
                    enabled: pluginFlags.multiselectScope.inline,
                    callback: () => {
                        api.doInlineSelected(plugin, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.external],
                });
                break;
            case "movable":
                options.push({
                    sort: MenuItemLabels.set_movable,
                    text: getItemText(MenuItemLabels.set_movable),
                    enabled: pluginFlags.multiselectScope.movable,
                    callback: () => {
                        api.setMovableSelected(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_movable],
                });
                options.push({
                    sort: MenuItemLabels.set_unmovable,
                    text: getItemText(MenuItemLabels.set_unmovable),
                    enabled: pluginFlags.multiselectScope.movable,
                    callback: () => {
                        api.setMovableSelected(plugin, false);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.set_unmovable],
                });
                break;
            case "paste":
                options.push({
                    sort: MenuItemLabels.paste,
                    text: getItemText(MenuItemLabels.paste),
                    enabled: pluginFlags.multiselectScope.paste,
                    callback: () => {
                        api.doPasteCopied(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.paste],
                });
                break;
            case "redo":
                options.push({
                    sort: MenuItemLabels.redo,
                    text: getItemText(MenuItemLabels.redo),
                    enabled: pluginFlags.multiselectScope.redo,
                    callback: () => {
                        api.doRedo(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.redo],
                });
                break;
            case "reset":
                options.push({
                    sort: MenuItemLabels.reset,
                    text: getItemText(MenuItemLabels.reset),
                    enabled: pluginFlags.multiselectScope.reset,
                    callback: () => {
                        api.doReset(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.reset],
                });
                break;
            case "select":
                options.push({
                    sort: MenuItemLabels.select_all,
                    text: getItemText(MenuItemLabels.select_all),
                    enabled: pluginFlags.multiselectScope.select,
                    callback: () => {
                        api.doSelectAll(plugin, true);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.select_all],
                });
                break;
            case "undo":
                options.push({
                    sort: MenuItemLabels.undo,
                    text: getItemText(MenuItemLabels.undo),
                    enabled: pluginFlags.multiselectScope.undo,
                    callback: () => {
                        api.doUndo(plugin);
                    },
                    scope: scope,
                    weight: weights[MenuItemLabels.undo],
                });
                break;
            default:
                throw new Error(`Encountered unknown multiselect flag key ${optionName}`);
        }
    }

    return options;
}
