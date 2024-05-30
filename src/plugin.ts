import * as Blockly from "blockly/core";
import { customShowContextMenu } from "./menus";
import { CombinedScope, PluginFlags, BlockScopeFlagKeys, WorkspaceScopeFlagKeys, MultiScopeFlagKeys } from "./types";
import * as api from "./api";
import { deepMerge } from "./util";
import { multiselectStyles } from "./styles";

declare global {
     interface Window {
         MultiselectPlugin: MultiselectPlugin;
     }
}

export class MultiselectPlugin {
    static minBlockHeight = 24; // See: https://github.com/google/blockly/blob/f363252d355020539b49b3df85c59b639c4c486a/core/renderers/common/constants.ts#L186
    static pasteOffset = 20;
    static deleteCodes: string[] = ["Delete", "Backspace"];

    public options: PluginFlags;

    protected blockly: typeof Blockly;
    protected workspace: Blockly.WorkspaceSvg;

    protected blocklySvg: HTMLElement;
    protected blocklyWorkspace: HTMLElement;
    protected blocklyBlockCanvas: HTMLElement;
    protected blocklyMainBackground: HTMLElement;

    protected multiselectIds: Set<string>; // Block ids of currently selected blocks
    protected multiselectCoords: Map<string, Blockly.utils.Coordinate>; // Block positions at start of drag operation

    protected isDragging: boolean; // Dragging is in-progress
    protected isSelecting: boolean; // Selection rectangle resizing is in-progress

    protected startPos: Blockly.utils.Coordinate;
    protected startPtrCoords: Blockly.utils.Coordinate; // Pointer coords at start of drag operation
    protected selectionDiv: HTMLDivElement; // A <div> is used as selection rectangle

    protected copiedBlocks: object[]; // Temporary copy+paste storage for serialized blocks

    constructor(options: PluginFlags, workspace: Blockly.WorkspaceSvg, blockly = Blockly) {
        this.workspace = workspace;
        this.blockly = blockly;        
        
        // Merge default options with user-provided options, resulting in the "effective" options
        this.options = {
            copyPasteToStorage: true,
            copyPasteToClipboard: true,
            hideDisabledMenuItems: true,
            enableBlockMenu: true,
            enableWorkspaceMenu: true,
            blockScope: {
                [BlockScopeFlagKeys.comment]: true,
                [BlockScopeFlagKeys.copy]: true,
                [BlockScopeFlagKeys.deletable]: true,
                [BlockScopeFlagKeys.delete]: true,
                [BlockScopeFlagKeys.duplicate]: true,
                [BlockScopeFlagKeys.editable]: true,
                [BlockScopeFlagKeys.expand]: true,
                [BlockScopeFlagKeys.help]: true,
                [BlockScopeFlagKeys.inline]: true,
                [BlockScopeFlagKeys.movable]: true,
            },
            workspaceScope: {
                [WorkspaceScopeFlagKeys.cleanup]: true,
                [WorkspaceScopeFlagKeys.delete]: true,
                [WorkspaceScopeFlagKeys.expand]: true,
                [WorkspaceScopeFlagKeys.help]: true,
                [WorkspaceScopeFlagKeys.paste]: true,
                [WorkspaceScopeFlagKeys.redo]: true,
                [WorkspaceScopeFlagKeys.reset]: true,
                [WorkspaceScopeFlagKeys.select]: true,
                [WorkspaceScopeFlagKeys.undo]: true,
            },
            multiselectScope: {
                [MultiScopeFlagKeys.cleanup]: true,
                [MultiScopeFlagKeys.comment]: true,
                [MultiScopeFlagKeys.copy]: true,
                [MultiScopeFlagKeys.deletable]: true,
                [MultiScopeFlagKeys.delete]: true,
                [MultiScopeFlagKeys.duplicate]: true,
                [MultiScopeFlagKeys.editable]: true,
                [MultiScopeFlagKeys.expand]: true,
                [MultiScopeFlagKeys.inline]: true,
                [MultiScopeFlagKeys.movable]: true,
                [MultiScopeFlagKeys.paste]: true,
                [MultiScopeFlagKeys.redo]: true,
                [MultiScopeFlagKeys.reset]: true,
                [MultiScopeFlagKeys.select]: true,
                [MultiScopeFlagKeys.undo]: true,
            },
        };
        deepMerge(this.options, options);

    }

    async init() {
        this.blocklySvg = await this.getHtmlElement("blocklySvg");
        this.blocklyWorkspace = await this.getHtmlElement("blocklyWorkspace");
        this.blocklyBlockCanvas = await this.getHtmlElement("blocklyBlockCanvas");
        this.blocklyMainBackground = await this.getHtmlElement("blocklyMainBackground");

        this.multiselectIds = new Set<string>();
        this.multiselectCoords = new Map<string, Blockly.utils.Coordinate>();
        this.isDragging = false;
        this.isSelecting = false;
        this.startPos = null;
        this.startPtrCoords = null;
        this.selectionDiv = null;
        this.copiedBlocks = [];

        this.injectCSS(multiselectStyles, "multiselect-plugin-css");

        document.addEventListener("keydown", this.handleKeydownPassive.bind(this), true);
        document.addEventListener("keydown", this.handleKeydownNonPassive.bind(this), { passive: false }); // A second, keydown handler is needed for non-passive events (e.g. cmd-a)
        document.addEventListener("keyup", this.handleKeyup.bind(this), true);
        document.addEventListener("pointerdown", this.handlePointerDown.bind(this), true);
        document.addEventListener("pointermove", this.handlePointerMove.bind(this), true);
        document.addEventListener("pointerup", this.handlePointerUp.bind(this), true);

        this.workspace.addChangeListener(this.handleBlocklyEvents.bind(this));

        // Not sure this makes sense, especially since webpack is building for UMD now
        // if (!isNode) {
        //     window.MultiselectPlugin = this;
        // }
    }

    protected createSelectionDiv(e: PointerEvent) {
        // This is the selection rectangle that'll grow and shrink as the user drags the mouse
        this.isSelecting = true;
        this.startPos = new Blockly.utils.Coordinate(e.clientX, e.clientY);
        this.selectionDiv = document.createElement("div") as HTMLDivElement;
        this.selectionDiv.style.border = "1px dashed gold";
        this.selectionDiv.style.position = "fixed";
        this.selectionDiv.style.left = `${this.startPos.x}px`;
        this.selectionDiv.style.top = `${this.startPos.y}px`;
        this.selectionDiv.style.backgroundColor = "#FFD70022";
        document.body.appendChild(this.selectionDiv);
    }

    protected filterEnable(element: SVGElement, enabled: boolean) {
        if (enabled) {
            element.classList.add("multiselect-enabled");
        } else {
            element.classList.remove("multiselect-enabled");
        }
    }

    getBlockly(): typeof Blockly {
        return this.blockly;
    }

    /**
     * Given an element, return the first ancestor of element (or self) that is a child of blocklyBlockCanvas.
     * If the element is not a descendant of the blocklyBlockCanvas, return null.
     * Otherwise, return the first ancestor of element (or self) that is a child of blocklyBlockCanvas.
     */
    protected getDraggableElement(element: HTMLElement): SVGElement | null {
        if (element === null || !this.blocklyBlockCanvas.contains(element)) {
            return null;
        } else {
            let currElement = element;
            while (currElement.parentElement !== this.blocklyBlockCanvas) {
                currElement = currElement.parentElement;
            }
            return currElement as unknown as SVGElement;
        }
    }

    protected getHtmlElement(name: string, maxWait = 5000): Promise<HTMLElement> {
        let waited = 0;
        return new Promise((resolve, reject) => {
            function findNamedElement() {
                const element = document.getElementsByClassName(name)[0] as HTMLElement;
                if (element) {
                    resolve(element);
                } else if (waited < maxWait) {
                    waited += 100;
                    setTimeout(findNamedElement, 100);
                } else {
                    reject(`No element ${name} found`);
                }
            }
            findNamedElement();
        });
    }

    getOptions(): PluginFlags {
        return this.options;
    }

    getSelected(): string[] {
        return Array.from<string>(this.multiselectIds);
    }

    getWorkspace(): Blockly.WorkspaceSvg {
        return this.workspace;
    }

    protected handleBackgroundClicked(e: PointerEvent) {
        if (Blockly.browserEvents.isRightButton(e)) {
            // Handle right-click on background
            if (this.numSelected() > 0) {
                // Show custom multiselect menu
                const blocks: Blockly.BlockSvg[] = [];
                this.getSelected().forEach((blockId) => {
                    blocks.push(this.workspace.getBlockById(blockId));
                });
                const scope: CombinedScope = { multiselect: blocks };
                customShowContextMenu(this, e, scope);
                e.stopPropagation();
            } else if (this.options.enableWorkspaceMenu) {
                // Show custom workspace menu
                e.stopPropagation(); // Call first, in case we throw error

                // Double-library inclusion caused widgetDiv to be undefined
                // The solution below never worked, the error was a red herring
                // this.blockly.WidgetDiv.createDom();
                // if (Blockly.WidgetDiv.getDiv() === undefined) {
                // }

                const scope: CombinedScope = { workspace: this.workspace };
                customShowContextMenu(this, e, scope);

                // e.preventDefault(); // for debugging only, i think this is "browser" default
            }
        } else if (e.shiftKey) {
            // Handle shift+click on background
            this.createSelectionDiv(e);
            e.stopPropagation(); // RE-ENABLE: for puppeteer problem debugging
        } else {
            // Handle left-click on background, by punting it to Blockly
            this.selectAll(false);
        }
    }

    protected handleBlocklyEvents(event: Blockly.Events.Abstract) {
        if (event.type === Blockly.Events.BLOCK_DELETE) {
            const deleteEvent = event as Blockly.Events.BlockDelete;
            // Should we check before attempting to delete?
            this.multiselectIds.delete(deleteEvent.blockId);
        }
    }

    protected handleKeydownNonPassive(e: KeyboardEvent) {
        if (!this.blocklySvg.contains(e.target as Node)) {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === "a") {
                this.selectAll(true);
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    protected handleKeydownPassive(e: KeyboardEvent) {
        // Ignore keydown events that occur outside of blocklySvg
        if (!this.blocklySvg.contains(e.target as Node)) {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === "c") {
                if (this.isMultiselect()) {
                    // this.doCopySelected();
                    api.doCopySelected(this);
                    e.stopPropagation();
                } else {
                    // this.doCopyBlocklySelected();
                    api.doCopyBlocklySelected(this);
                    // Don't stop propagation, this will allow paste to still work in
                    // single-select mode using Blockly's default copy-key behavior.
                }
            } else if (e.key === "v") {
                // Take over Blockly's default paste-key behavior completely
                // this.doPasteCopied(true);
                api.doPasteCopied(this, true);
                e.stopPropagation();
            }
        } else if (MultiselectPlugin.deleteCodes.includes(e.key) && this.isMultiselect()) {
            // this.doDeleteSelected();
            api.doDeleteSelected(this);
            e.stopPropagation();
        } else if (e.key === "Shift") {
            // console.log("Shift key pressed");
            e.stopPropagation();
        }
    }

    protected handleKeyup(e: KeyboardEvent) {
        if (e.key === "Shift") {
            // console.log("Shift key released");
            e.stopPropagation();
        } else if (MultiselectPlugin.deleteCodes.includes(e.key)) {
            e.stopPropagation();
        }
    }

    protected handlePointerDown(e: PointerEvent) {
        const elementBeneath = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        const topElement = this.getDraggableElement(elementBeneath);
        const blockId = topElement ? topElement.getAttribute("data-id") : null;

        // Handle click on background
        if (elementBeneath === this.blocklyMainBackground) {
            this.handleBackgroundClicked(e);
        }
        if (!topElement) return;
        // Handle click on block
        this.handleTopBlockClicked(e, blockId);
    }

    protected handlePointerMove(e: PointerEvent): void {
        // REMOVE: for debugging puppeteer tests
        // console.log('handlePointerMove', e.clientX, e.clientY, this.isSelecting, this.isDragging, this.startPos, this.startPtrCoords, this.selectionDiv, this.multiselectCoords);
        if (this.isSelecting) {
            // Resize selection rectangle
            const width = e.clientX - this.startPos.x;
            const height = e.clientY - this.startPos.y;
            this.selectionDiv.style.width = `${Math.abs(width)}px`;
            this.selectionDiv.style.height = `${Math.abs(height)}px`;
            this.selectionDiv.style.left = `${width > 0 ? this.startPos.x : e.clientX}px`;
            this.selectionDiv.style.top = `${height > 0 ? this.startPos.y : e.clientY}px`;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (this.isDragging) {
            // Move all selected blocks
            const curPtrCoords = Blockly.utils.svgMath.screenToWsCoordinates(
                this.workspace,
                new Blockly.utils.Coordinate(e.clientX, e.clientY)
            );
            const deltaX = curPtrCoords.x - this.startPtrCoords.x;
            const deltaY = curPtrCoords.y - this.startPtrCoords.y;
            this.getSelected().forEach((blockId) => {
                const block = this.workspace.getBlockById(blockId);
                if (block.getParent() === null) {
                    const startPos = this.multiselectCoords.get(blockId);
                    block.translate(startPos.x + deltaX, startPos.y + deltaY);
                }
            });
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }

    protected handlePointerUp(e: PointerEvent) {
        if (this.isSelecting) {
            // Get selection rectangle's bounding coordinates
            const selectDOMRect = this.selectionDiv.getBoundingClientRect();
            document.body.removeChild(this.selectionDiv);
            this.selectionDiv = null;

            // Convert to workspace coordinates
            const leftTop = Blockly.utils.svgMath.screenToWsCoordinates(
                this.workspace,
                new Blockly.utils.Coordinate(selectDOMRect.left, selectDOMRect.top)
            );
            const rightBot = Blockly.utils.svgMath.screenToWsCoordinates(
                this.workspace,
                new Blockly.utils.Coordinate(selectDOMRect.right, selectDOMRect.bottom)
            );
            const selectRect = new Blockly.utils.Rect(leftTop.y, rightBot.y, leftTop.x, rightBot.x);

            // Select all blocks within bounding rectangle
            const allTopBlocks = this.workspace.getTopBlocks(false);
            allTopBlocks.forEach((topBlock) => {
                const blockRect = topBlock.getBoundingRectangle();
                if (this.rectsIntersect(selectRect, blockRect)) {
                    this.select(topBlock.id, true);
                }
            });
            this.isSelecting = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (this.isDragging) {
            this.isDragging = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
    }

    protected handleTopBlockClicked(e: PointerEvent, blockId: string) {
        if (Blockly.browserEvents.isRightButton(e)) {
            // Handle right-click on block
            if (this.isSelected(blockId)) {
                // Show custom block menu (enableBlockMenu flag must be true),
                // otherwise we'll see the multiselect menu instead.
                const scope = { block: this.workspace.getBlockById(blockId) };
                customShowContextMenu(this, e, scope);
                e.stopPropagation();
            } else if (this.numSelected() > 0) {
                // Handle right-click on unselected block by punting it to Blockly
                this.selectAll(false);
            }
        } else if (e.shiftKey) {
            // Handle shift+click on block
            this.toggleSelect(blockId);
            e.stopPropagation();
        } else {
            // Handle left-click on block
            if (this.isSelected(blockId)) {
                // Handle drag-start for all selected blocks
                this.isDragging = true;
                this.multiselectCoords.clear();
                this.multiselectIds.forEach((blockId) => {
                    this.multiselectCoords.set(blockId, this.workspace.getBlockById(blockId).getRelativeToSurfaceXY());
                });
                this.startPtrCoords = Blockly.utils.svgMath.screenToWsCoordinates(
                    this.workspace,
                    new Blockly.utils.Coordinate(e.clientX, e.clientY)
                );
                e.stopPropagation();
            } else {
                // Handle left-click on unselected block, then let Blockly handle it
                this.selectAll(false);
            }
        }
    }

    protected injectCSS(cssContent: string, id: string) {
        if (document.getElementById(id)) {
            return; // Abort if already injected
        }
        const style = document.createElement("style");
        style.id = id; // Assign an id, to later remove the element by
        style.type = "text/css";
        style.appendChild(document.createTextNode(cssContent));
        document.head.appendChild(style);
    }

    protected isMultiselect(): boolean {
        return this.numSelected() > 0;
    }

    numCopied() {
        return this.copiedBlocks.length;
    }

    clearCopied() {
        this.copiedBlocks = [];
    }

    addCopied(state: object) {
        this.copiedBlocks.push(state);
    }

    getCopied() {
        return this.copiedBlocks;
    }

    numSelected() {
        return this.multiselectIds.size;
    }

    clearSelected() {
        this.multiselectIds.clear();
    }

    addSelected(blockId: string) {
        this.multiselectIds.add(blockId);
    }

    removeSelected(blockId: string) {
        this.multiselectIds.delete(blockId);
    }

    isSelected(blockId: string): boolean {
        return this.multiselectIds.has(blockId);
    }

    protected rectsIntersect(rect1: Blockly.utils.Rect, rect2: Blockly.utils.Rect): boolean {
        return (
            rect1.left < rect2.right && rect1.right > rect2.left && rect1.top < rect2.bottom && rect1.bottom > rect2.top
        );
    }

    protected removeCSS(id: string) {
        const styleElement = document.getElementById(id);
        if (styleElement) {
            document.head.removeChild(styleElement);
        }
    }

    select(blockId: string, selected: boolean) {
        const turnMeOff = this.blockly.getSelected();
        turnMeOff && turnMeOff.unselect();

        const blockSvg = this.workspace.getBlockById(blockId);
        // blockSvg.unselect(); // should always be Blockly.getSelected().unselect(), always deselect Blockly when multiselect is in use
        selected ? blockSvg.addSelect() : blockSvg.removeSelect();
        selected ? this.multiselectIds.add(blockId) : this.multiselectIds.delete(blockId);

        const svgElement = blockSvg.getSvgRoot();
        this.filterEnable(svgElement, selected);
    }

    selectAll(select: boolean) {
        const blocks = this.workspace.getTopBlocks(false);
        blocks.forEach((block) => {
            this.select(block.id, select);
        });
    }

    protected toggleSelect(blockId: string): boolean {
        this.select(blockId, !this.multiselectIds.has(blockId));
        return this.isSelected(blockId);
    }
}