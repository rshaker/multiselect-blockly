import * as Blockly from "blockly/core";
import * as puppeteer from "puppeteer";
import { assert } from "chai";
import * as fs from "fs/promises";
import * as path from "path";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import { installPptrPointer } from "./pptr-pointer";

let browser: puppeteer.Browser;
let page: puppeteer.Page;
let recorder: PuppeteerScreenRecorder;

describe("Workspace context menu options", function () {
    this.timeout(0); // Disable all timeouts, puppeteer tests can take a long time

    before(async () => {
        browser = await puppeteer.launch({
            headless: false,
            // slowMo: 200,
            // userDataDir: './tmp/puppeteer',
            // devtools: false,
        });
    });

    beforeEach(async () => {
        // Open a new page for each test
        page = await browser.newPage();
        await installPptrPointer(page);
        await page.setViewport({
            width: 1000,
            height: 800,
            deviceScaleFactor: 1,
        });

        // Load the testing workspace
        await page.goto("file://" + path.join(__dirname, "../workspace/index.html"));
        
        // Start video recording of the test
        const re = new RegExp(/ +/, "g");
        const captureDir = path.join(__dirname, `./captures/`);
        const capturePath = path.join(captureDir, `${this.ctx.currentTest?.title.replace(re, "-")}`);
        const config = {
            followNewTab: true,
            fps: 60,
            // The videoFrame defaults to viewport size, so no need to set it
            // videoFrame: {
            //     width: 1000,
            //     height: 800,
            // },
            videoCrf: 18,
            videoCodec: "libx264",
            videoPreset: "ultrafast",
            videoBitrate: 1000,
            aspectRatio: "4:3",
        };
        recorder = new PuppeteerScreenRecorder(page, config);
        await recorder.start(`${capturePath}.mp4`); // supports extension - mp4, avi, webm and mov

        // Wait for the Blockly's background to be created
        const backgroundSelector = ".blocklyMainBackground";
        await page.waitForSelector(backgroundSelector);

        // Load a previously saved workspace from file
        const savedState = await fs.readFile(path.join(__dirname, "../fixtures/blocks.json"), "utf8");
        await page.evaluate((state) => {
            console.log("Loading workspace from state: ", JSON.parse(state));
            Blockly.serialization.workspaces.load(JSON.parse(state), Blockly.getMainWorkspace(), {
                recordUndo: false,
            });
            console.log("Workspace loaded");
        }, savedState);
    });

    afterEach(async () => {
        await recorder.stop();
        // await page.close();
    });

    after(async () => {
        // await browser.close();
    });

    it("should Cleanup selected blocks", async function () {
        await shouldCleanup();
    });

    // it("should Cleanup all blocks", async function () {
    //     await shouldCleanupAll();
    // });

    // it("should Collapse all blocks", async function() {
    //     await shouldCollapseAll();
    // });

    // it("should Collapse selected blocks", async function() {
    //     await shouldCollapse();
    // });

    // it("should Copy selected blocks", async function() {
    //     await shouldCopy();
    // });

    // it("should Delete all blocks", async function() {
    //     await shouldDeleteAll();
    // });

    // it("should Delete selected blocks", async function() {
    //     await shouldDelete();
    // });

    // it("should Expand all blocks", async function() {
    //     await shouldExpandAll();
    // });

    // it("should Expand selected blocks", async function () {
    //     await shouldExpand();
    // });

    // it("should Paste blocks after copy", async function() {
    //     await shouldPaste();
    // });

    async function shouldCleanup() {
        let recon = await getRecon();
        await selectRegion(START_MOUSE_POS, END_MOUSE_POS);
        await selectMenuItem("span#ms-menuitem-cleanup");
    }
    
    async function shouldCleanupAll() {
        let recon = await getRecon();
        let isLeftJustified = recon.blockRecon.reduce(
            (leftJustified, blockRecon) => leftJustified && blockRecon.relativeCoords.x == 0, true);
        // Test that there not all blocks are left-aligned (same x position == 0)
        assert.isTrue(!isLeftJustified && recon.blockRecon.length > 1);
        await selectMenuItem("span#ms-menuitem-cleanup-all");
        recon = await getRecon();
        isLeftJustified = recon.blockRecon.reduce(
            (leftJustified, blockRecon) => leftJustified && blockRecon.relativeCoords.x == 0, true);
        // Test that all blocks are left-aligned (same x position == 0)
        assert.isTrue(isLeftJustified);
    }

    async function shouldCollapse() {
        await shouldExpandAll();
        let recon = await getRecon();
        let numCollapsed = recon.blockRecon.reduce((accum, value) => accum + (value.isCollapsed ? 1 : 0), 0);
        // Test that no blocks are collapsed before selection
        assert.isTrue(numCollapsed === 0);
        await selectRegion(START_MOUSE_POS, END_MOUSE_POS);
        await selectMenuItem("span#ms-menuitem-collapse");
        recon = await getRecon();
        numCollapsed = recon.blockRecon.reduce((accum, value) => accum + (value.isCollapsed ? 1 : 0), 0);
        // Test that the correct number of blocks are collapsed
        assert.isTrue(numCollapsed === NUM_SELECTED_BLOCKS);
    }

    async function shouldCollapseAll() {
        await selectMenuItem("span#ms-menuitem-collapse-all");
        const recon = await getRecon();
        let numCollapsed = recon.blockRecon.reduce((accum, blockRecon) => accum + (blockRecon.isCollapsed ? 1 : 0), 0);
        // Test that all blocks are collapsed
        assert.isTrue(numCollapsed === NUM_BLOCKS);
    }

    async function shouldCopy() {
        // Test that no blocks are copied before selection
        let recon = await getRecon();
        assert.isTrue(recon.workspaceRecon.numCopied === 0);
        await selectRegion(START_MOUSE_POS, END_MOUSE_POS);
        await selectMenuItem("span#ms-menuitem-copy");
        recon = await getRecon();
        // Test that the correct number of blocks are copied
        assert.isTrue(recon.workspaceRecon.numCopied === NUM_SELECTED_BLOCKS);
    }

    async function shouldDelete() {
        let recon = await getRecon();
        // Test that no blocks are deleted before selection
        assert.isTrue(recon.workspaceRecon.numBlocks === NUM_BLOCKS);
        await selectRegion(START_MOUSE_POS, END_MOUSE_POS);
        await selectMenuItem("span#ms-menuitem-delete");
        recon = await getRecon();
        // Test that the correct number of blocks are deleted
        assert.isTrue(recon.workspaceRecon.numBlocks === NUM_BLOCKS - NUM_SELECTED_BLOCKS);
    }

    async function shouldDeleteAll() {
        let recon = await getRecon();
        // Test that there are blocks to be deleted
        assert(recon.workspaceRecon.numBlocks > 0);
        await selectMenuItem("span#ms-menuitem-delete-all");
        recon = await getRecon();
        // Test that all blocks are deleted
        assert(recon.workspaceRecon.numBlocks === 0);
    }

    async function shouldExpandAll() {
        await selectMenuItem("span#ms-menuitem-expand-all");
        const recon = await getRecon();
        let numExpanded = recon.blockRecon.reduce((accum, blockRecon) => accum + (blockRecon.isCollapsed ? 0 : 1), 0);
        assert.isTrue(numExpanded === NUM_BLOCKS);
    }

    async function shouldExpand() {
        await shouldCollapseAll();
        let recon = await getRecon();
        let numExpanded = recon.blockRecon.reduce((accum, value) => accum + (value.isCollapsed ? 0 : 1), 0);
        // Test that no blocks are expanded before selection
        assert.isTrue(numExpanded === 0);
        await selectRegion(START_MOUSE_POS, END_MOUSE_POS);
        await selectMenuItem("span#ms-menuitem-expand");
        recon = await getRecon();
        numExpanded = recon.blockRecon.reduce((accum, value) => accum + (value.isCollapsed ? 0 : 1), 0);
        // Test that the correct number of blocks are expanded
        assert.isTrue(numExpanded === NUM_SELECTED_BLOCKS);
    }

    async function shouldPaste() {
        await shouldCopy();
        let recon = await getRecon();
        const numBlocksBefore = recon.workspaceRecon.numBlocks;
        await selectMenuItem("span#ms-menuitem-paste");
        recon = await getRecon();
        // Test that the correct number of blocks are pasted
        assert.isTrue(recon.workspaceRecon.numBlocks === numBlocksBefore + NUM_SELECTED_BLOCKS);
    }
});

async function getRecon(): Promise<Recon> {
    return await page.evaluate(async () => {
        const workspace = Blockly.getMainWorkspace();
        const blocks = workspace.getTopBlocks();
        const blockRecon = blocks.map((block): BlockRecon =>  {
            const blockSvg = block as Blockly.BlockSvg;
            return { 
                boundingBox: blockSvg.getBoundingRectangle(), 
                isCollapsed: blockSvg.isCollapsed(), 
                isTopLevel: blockSvg.getParent() === null, 
                relativeCoords: blockSvg.getRelativeToSurfaceXY(), 
            };
        });
        const workspaceRecon: WorkspaceRecon = {
            // numSelected: window.MultiselectPlugin.numSelected(),
            // numCopied: window.MultiselectPlugin.numCopied(),
            // numBlocks: workspace.getAllBlocks().length,
            numSelected: 0,
            numCopied: 0,
            numBlocks: 0,
        }
        
        return Promise.resolve({blockRecon, workspaceRecon});
    });
}

async function activateContextMenu(x: number, y: number) {
    await page.mouse.move(x, y, { steps: 50 });
    await page.mouse.down({ button: "right" });
    await page.mouse.up({ button: "right" });
    // await 

    // await page.mouse.click(x, 700, { button: "right" });
}

// async function selectContextMenuItem(menuitemSelector: string) {
    
// }

async function selectMenuItem(menuitemSelector: string) {
    // Activate pop-up context menu
    // await page.mouse.move(startXY.x, startXY.y, { steps: 100 });
    await page.click("div#blocklyDiv", { button: "right", offset: { x: 544, y: 323 }});

    // Wait for menu item to be available, then click it
    await page.waitForSelector(menuitemSelector);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.click(menuitemSelector);
    
    await delay(250); // Replace with a better solution? move this into the page.evaluate() below here
}

async function selectRegion(startXY: Blockly.utils.Coordinate, endXY: Blockly.utils.Coordinate) {
    await page.mouse.move(startXY.x, startXY.y, { steps: 100 });
    await page.keyboard.down('Shift');
    await page.mouse.down(); // Defaults to the left mouse button
    await page.mouse.move(endXY.x, endXY.y, { steps: 150 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const START_MOUSE_POS = new Blockly.utils.Coordinate(180, 40);
const END_MOUSE_POS = new Blockly.utils.Coordinate(500, 400);
const NUM_SELECTED_BLOCKS = 4;
const NUM_BLOCKS = 10;

interface BlockRecon {
    boundingBox: Blockly.utils.Rect;
    isCollapsed: boolean;
    isTopLevel: boolean;
    relativeCoords: Blockly.utils.Coordinate;
}

interface WorkspaceRecon {
    numSelected: number;
    numCopied: number;
    numBlocks: number;
}

interface Recon {
    blockRecon: BlockRecon[];
    workspaceRecon: WorkspaceRecon;
}

