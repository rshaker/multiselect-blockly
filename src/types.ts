import * as Blockly from "blockly/core";

// Required for custom context menu options (e.g. sort)
export interface CustomContextMenuOption extends Blockly.ContextMenuRegistry.ContextMenuOption {
    sort?: string,
}

// Define a new scope type for this plugin, then combine it with Blockly's scopes
export interface CombinedScope extends Blockly.ContextMenuRegistry.Scope {
    multiselect?: Blockly.BlockSvg[];
    // block?: BlockSvg;
    // workspace?: WorkspaceSvg;
}

// These are the supported configuration flags for this plugin, they are all optional
export interface PluginFlags {
    copyPasteToStorage?: boolean,
    copyPasteToClipboard?: boolean,
    hideDisabledMenuItems?: boolean,
    enableBlockMenu?: boolean,
    enableWorkspaceMenu?: boolean,
    blockScope?: BlockScopeFlags;
    workspaceScope?: WorkspaceScopeFlags;
    multiselectScope?: MultiScopeFlags;
}

// Supported block flags
export interface BlockScopeFlags {
    comment?: boolean;
    copy?: boolean;
    deletable?: boolean;
    delete?: boolean;
    duplicate?: boolean;
    editable?: boolean;
    expand?: boolean;
    help?: boolean;
    inline?: boolean;
    movable?: boolean;
}

// Supported workspace flags
export interface WorkspaceScopeFlags {
    cleanup?: boolean;
    delete?: boolean;
    expand?: boolean;
    help?: boolean;
    paste?: boolean;
    redo?: boolean;
    reset?: boolean;
    select?: boolean;
    undo?: boolean;
}

// Supported multiselect flags
export interface MultiScopeFlags {
    cleanup?: boolean;
    comment?: boolean;
    copy?: boolean;
    deletable?: boolean;
    delete?: boolean;
    duplicate?: boolean;
    editable?: boolean;
    expand?: boolean;
    inline?: boolean;
    movable?: boolean;
    paste?: boolean;
    redo?: boolean;
    reset?: boolean;
    select?: boolean;
    undo?: boolean;
    undeletable?: boolean;
    uneditable?: boolean;
    unmovable?: boolean;
}

// TODO: move constants to separate file, and move types to .d.ts file

// Use `keyof` to type-check for invalid keys (see https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
export const BlockScopeFlagKeys: { [K in keyof BlockScopeFlags]: K } = {
    comment: "comment",
    copy: "copy",
    deletable: "deletable",
    delete: "delete",
    duplicate: "duplicate",
    editable: "editable",
    expand: "expand",
    help: "help",
    inline: "inline",
    movable: "movable",
}; 

export const WorkspaceScopeFlagKeys: { [K in keyof WorkspaceScopeFlags]: K } = {
    cleanup: "cleanup",
    delete: "delete",
    expand: "expand",
    help: "help",    
    paste: "paste",
    redo: "redo",
    reset: "reset",
    select: "select",
    undo: "undo",
};

export const MultiScopeFlagKeys: { [K in keyof MultiScopeFlags]: K } = {
    cleanup: "cleanup",
    comment: "comment",
    copy: "copy",
    deletable: "deletable",
    delete: "delete",
    duplicate: "duplicate",
    editable: "editable",
    expand: "expand",
    inline: "inline",
    movable: "movable",
    paste: "paste",
    redo: "redo",
    reset: "reset",
    select: "select",
    undo: "undo",
  };
  
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
  