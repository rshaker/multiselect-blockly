import { Page } from "@playwright/test";
import * as Blockly from "blockly/core";

interface BlockRecon {
    isCollapsed: boolean;
    isTopLevel: boolean;
    boundingRect: Blockly.utils.Rect;
    relativeCoords: Blockly.utils.Coordinate;
    screenCoords: Blockly.utils.Coordinate;
    centerCoords: Blockly.utils.Coordinate;
}

interface WorkspaceRecon {
    numSelected: number;
    numCopied: number;
    numBlocks: number;
    numTopBlocks: number;
    maxBoundingRect: Blockly.utils.Rect;
}

interface Recon {
    blockRecon: BlockRecon[];
    workspaceRecon: WorkspaceRecon;
}

export async function doRecon(page: Page, delay = 0): Promise<Recon> {
    await page.waitForTimeout(delay);
    return await page.evaluate(async () => {
        const workspace = Blockly.getMainWorkspace();
        const blocks = workspace.getTopBlocks();
        blocks.forEach((block) => {
            const relativeCoords = block.getRelativeToSurfaceXY();
            const screenCoords = Blockly.utils.svgMath.wsToScreenCoordinates(
                workspace as Blockly.WorkspaceSvg,
                relativeCoords
            );
            console.log("relative", JSON.stringify(relativeCoords), "screen", JSON.stringify(screenCoords));
        });

        const blockRecon = blocks.map((block): BlockRecon => {
            const blockSvg = block as Blockly.BlockSvg;
            const relativeCoords = blockSvg.getRelativeToSurfaceXY();
            const screenCoords = Blockly.utils.svgMath.wsToScreenCoordinates(
                workspace as Blockly.WorkspaceSvg,
                blockSvg.getRelativeToSurfaceXY()
            );
            // const deltaX = screenCoords.x - relativeCoords.x;
            // const deltaY = screenCoords.y - relativeCoords.y;
            const wsBoundingRect = blockSvg.getBoundingRectangle();
            const scBoundingRect = blockSvg.getSvgRoot().getBoundingClientRect();
            const centerCoords = new Blockly.utils.Coordinate(
                (scBoundingRect.left + scBoundingRect.right) / 2,
                (scBoundingRect.top + scBoundingRect.bottom) / 2
            );
            return {
                boundingRect: wsBoundingRect,
                isCollapsed: blockSvg.isCollapsed(),
                isTopLevel: blockSvg.getParent() === null,
                relativeCoords: relativeCoords,
                screenCoords: screenCoords,
                centerCoords: centerCoords,
            };
        });

        const workspaceRecon: WorkspaceRecon = {
            numSelected: window.MultiselectPlugin.numSelected(),
            numCopied: window.MultiselectPlugin.numCopied(),
            numBlocks: workspace.getAllBlocks().length,
            numTopBlocks: workspace.getTopBlocks().length,
            maxBoundingRect: blockRecon.reduce((overallBox, block) => {
                const boundingBox = block.boundingRect;
                return new Blockly.utils.Rect(
                    Math.min(overallBox.top, boundingBox.top),
                    Math.max(overallBox.bottom, boundingBox.bottom),
                    Math.min(overallBox.left, boundingBox.left),
                    Math.max(overallBox.right, boundingBox.right)
                );
            }, new Blockly.utils.Rect(Infinity, -Infinity, Infinity, -Infinity)),
        };

        return Promise.resolve({ blockRecon, workspaceRecon });
    });
}

export async function waitForBlocksToLoad(page: Page, topLevelBlockCount: number, timeout = 10000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const blockCount = await page.evaluate(() => {
            return Blockly.getMainWorkspace().getTopBlocks(false).length;
        });
        if (blockCount === topLevelBlockCount) {
            return; // Blocks have finished loading
        }
        await page.waitForTimeout(interval); // Wait before polling again
    }
    throw new Error("Blocks did not load in time");
}
