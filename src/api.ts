import * as Blockly from "blockly/core";
import { State } from "blockly/core/serialization/blocks";
import { MultiselectPlugin } from "./plugin";

export function doCleanupAll(plugin: MultiselectPlugin) {
    plugin.getWorkspace().cleanUp();
}

export function doCleanupSelected(plugin: MultiselectPlugin) {
    const blockly = plugin.getBlockly();
    const workspace = plugin.getWorkspace();
    blockly.Events.setGroup(true);
    workspace.setResizesEnabled(false);
    const topBlocks = plugin.getSelected().map((blockId) => {
        return workspace.getBlockById(blockId);
    });
    let cursorY = 0;
    for (let i = 0, block: Blockly.BlockSvg; (block = topBlocks[i]); i++) {
        if (!block.isMovable()) {
            continue;
        }
        const xy = block.getRelativeToSurfaceXY();
        block.moveBy(-xy.x, cursorY - xy.y, ["cleanup"]);
        block.snapToGrid();
        cursorY =
            block.getRelativeToSurfaceXY().y +
            block.getHeightWidth().height +
            // this.workspace.renderer.getConstants().MIN_BLOCK_HEIGHT;
            MultiselectPlugin.minBlockHeight;
    }
    workspace.setResizesEnabled(true);
    blockly.Events.setGroup(false);
}

export function doCollapse(plugin: MultiselectPlugin, blockId: string, collapse: boolean) {
    const block = plugin.getWorkspace().getBlockById(blockId);
    block.setCollapsed(collapse);
}

export function doCollapseAll(plugin: MultiselectPlugin, isCollapsed: boolean) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    plugin.getWorkspace().getAllBlocks().forEach((block) => {
        block.setCollapsed(isCollapsed);
    });
    blockly.Events.setGroup(false);
}

export function doCollapseSelected(plugin: MultiselectPlugin, collapse: boolean) {
    const blockly = plugin.getBlockly();
    const workspace = plugin.getWorkspace();
    blockly.Events.setGroup(true);
    plugin.getSelected().forEach((blockId) => {
        const block = workspace.getBlockById(blockId);
        block.setCollapsed(collapse);
    });
    blockly.Events.setGroup(false);
}

export function doComment(plugin: MultiselectPlugin, blockId: string, comment: string) {
    const block = plugin.getWorkspace().getBlockById(blockId);
    block.setCommentText(comment);
}

export function doCommentSelected(plugin: MultiselectPlugin, comment: string) {
    const blockly = plugin.getBlockly();
    const workspace = plugin.getWorkspace();
    blockly.Events.setGroup(true);
    plugin.getSelected().forEach((blockId) => {
        const block = workspace.getBlockById(blockId);
        block.setCommentText(comment);
    });
    blockly.Events.setGroup(false);
}

export function doCopy(plugin: MultiselectPlugin, blockId: string) {
    plugin.clearCopied();
    const block = plugin.getWorkspace().getBlockById(blockId);
    const state = plugin.getBlockly().serialization.blocks.save(block, {
        addCoordinates: true,
        addInputBlocks: true,
        addNextBlocks: false,
        doFullSerialization: true,
    });
    plugin.addCopied(state);
}

export function doCopySelected(plugin: MultiselectPlugin) {
    plugin.clearCopied();
    const workspace = plugin.getWorkspace();
    plugin.getSelected().forEach((blockId: string) => {
        const block = workspace.getBlockById(blockId);
        const state = plugin.getBlockly().serialization.blocks.save(block, {
            addCoordinates: true,
            addInputBlocks: true,
            addNextBlocks: false,
            doFullSerialization: true,
        });
        plugin.addCopied(state);
    });
}

export function doCopyBlocklySelected(plugin: MultiselectPlugin) {
    const blockly = plugin.getBlockly();
    const selected = blockly.getSelected();
    if (selected) {
        const block = plugin.getWorkspace().getBlockById(selected.id);
        const state = blockly.serialization.blocks.save(block, {
            addCoordinates: true,
            addInputBlocks: true,
            addNextBlocks: false,
            doFullSerialization: true,
        });
        plugin.clearCopied();
        plugin.addCopied(state);
    }
}

export function doDelete(plugin: MultiselectPlugin, blockId: string) {
    const block = plugin.getWorkspace().getBlockById(blockId);
    if (block.isDeletable()) {
        plugin.removeSelected(blockId);
        block.dispose();
    }
}

export function doDeleteAll(plugin: MultiselectPlugin) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    plugin.getWorkspace().getAllBlocks().forEach((block) => {
        plugin.removeSelected(block.id);
        block.dispose();
    });
    blockly.Events.setGroup(false);
}

export function doDeleteSelected(plugin: MultiselectPlugin) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    const workspace = plugin.getWorkspace();
    plugin.getSelected().forEach((blockId) => {
        const block = workspace.getBlockById(blockId);
        if (block.isDeletable()) {
            plugin.removeSelected(blockId);
            block.dispose();
        }
    });
    blockly.Events.setGroup(false);
}

export function doDuplicate(plugin: MultiselectPlugin, blockId: string) {
    doCopy(plugin, blockId);
    doPasteCopied(plugin, true);
}

export function doDuplicateSelected(plugin: MultiselectPlugin) {
    doCopySelected(plugin);
    doPasteCopied(plugin, true);
}

export function doHelp(plugin: MultiselectPlugin, blockId: string) {
    if (blockId) {
        const block = plugin.getWorkspace().getBlockById(blockId);
        block.showHelp();
    } else {
        // This won't work, just a placeholder for thought
        // this.blockly.showHelp();
    }
}

export function doInline(plugin: MultiselectPlugin, blockId: string, inline: boolean) {
    const block = plugin.getWorkspace().getBlockById(blockId);
    block.setInputsInline(inline);
}

export function doInlineSelected(plugin: MultiselectPlugin, inline: boolean) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    plugin.getSelected().forEach((blockId) => {
        const block = plugin.getWorkspace().getBlockById(blockId);
        block.setInputsInline(inline);
    });
    blockly.Events.setGroup(false);
}

export function doPasteCopied(plugin: MultiselectPlugin, isSelected: boolean) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    plugin.selectAll(false);
    const workspace = plugin.getWorkspace();
    plugin.getCopied().forEach((state: State) => {
        state.x += MultiselectPlugin.pasteOffset;
        state.y += MultiselectPlugin.pasteOffset;
        const block = blockly.serialization.blocks.append(state, workspace, { recordUndo: true });
        plugin.select(block.id, isSelected);
    });
    blockly.Events.setGroup(false);
}

export function doRedo(plugin: MultiselectPlugin) {
    plugin.getWorkspace().undo(true);
}

export function doReset(plugin: MultiselectPlugin) {
    plugin.getWorkspace().clear();
}

export function doSelectAll(plugin: MultiselectPlugin, isSelected: boolean) {
    plugin.selectAll(isSelected);
}

export function doUndo(plugin: MultiselectPlugin) {
    plugin.getWorkspace().undo(false);
}

export function getNumSelected(plugin: MultiselectPlugin) {
    return plugin.getSelected().length;
}

export function setEditable(plugin: MultiselectPlugin, blockId: string, editable: boolean) {
    const block = plugin.getWorkspace().getBlockById(blockId);
    block.setEditable(editable);
}

export function setEditableSelected(plugin: MultiselectPlugin, editable: boolean) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    plugin.getSelected().forEach((blockId) => {
        setEditable(plugin, blockId, editable);
    });
    blockly.Events.setGroup(false);
}

export function setDeletable(plugin: MultiselectPlugin, blockId: string, deletable: boolean) {
    const block = plugin.getWorkspace().getBlockById(blockId);
    block.setDeletable(deletable);
}

export function setDeletableSelected(plugin: MultiselectPlugin, deletable: boolean) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    plugin.getSelected().forEach((blockId) => {
        setEditable(plugin, blockId, deletable);
    });
    blockly.Events.setGroup(false);
}

export function setMovable(plugin: MultiselectPlugin, blockId: string, movable: boolean) {
    const block = plugin.getWorkspace().getBlockById(blockId);
    block.setMovable(movable);
}

export function setMovableSelected(plugin: MultiselectPlugin, movable: boolean) {
    const blockly = plugin.getBlockly();
    blockly.Events.setGroup(true);
    plugin.getSelected().forEach((blockId) => {
        setMovable(plugin, blockId, movable);
    });
    blockly.Events.setGroup(false);
}