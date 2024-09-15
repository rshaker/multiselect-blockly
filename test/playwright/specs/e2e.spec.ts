import { test, expect, Page } from "@playwright/test";
import path from "path";
import * as Blockly from "blockly/core";
import * as fs from "fs/promises";
import { doRecon, waitForBlocksToLoad } from "./recon";

test.describe("Context menus", () => {
    let savedState: string;
    let topBlockCount: number;

    test.beforeAll(async () => {
        savedState = await fs.readFile(path.join(__dirname, "../../fixtures/blocks.json"), "utf8");
        topBlockCount = JSON.parse(savedState).blocks.blocks.length;
    });

    test.beforeEach(async ({ page }) => {
        await page.goto("file://" + path.join(__dirname, "../../workspace/index.html"));
        await page.evaluate((state) => {
            Blockly.serialization.workspaces.load(JSON.parse(state), Blockly.getMainWorkspace(), {
                recordUndo: false,
            });
        }, savedState);
        await waitForBlocksToLoad(page, topBlockCount);
    });

    /* Coords are from recon results, they could be auto-generated if desired */
    const selectRectStartCoord = { x: 180, y: 40 };
    const selectRectEndCoord = { x: 500, y: 400 };
    const blockCenterCoord = { x: 273, y: 106 };
    const workspaceEmptyCoord = { x: 850, y: 500 };

    /* Block: set a block undeletable, then deltable */
    test("Should set a block undeletable, then deltable", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-set-undeletable", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-set-deletable", blockCenterCoord);
        await page.waitForTimeout(250);
    });

    /* Block: set a block uneditable, then editable */
    test("Should set a block uneditable, then editable", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-set-uneditable", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-set-editable", blockCenterCoord);
        await page.waitForTimeout(250);
    });

    /* Block: set a block unmovable, then movable */
    test("Should set a block unmovable, then movable", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-set-unmovable", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-set-movable", blockCenterCoord);
        await page.waitForTimeout(250);
    });

    /* Block: comment and uncomment */
    test("Should create a new, empty comment on block", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-comment", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-uncomment", blockCenterCoord);
        await page.waitForTimeout(250);
    });

    /* Block: copy, delete, and paste */
    test("Should copy a block, delete it, then paste it", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-copy", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-delete", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-paste", workspaceEmptyCoord);
        await page.waitForTimeout(250);   
    });

    /* Block: external and internal */
    test("Should external inputs, then inline", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-external", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-inline", blockCenterCoord);
        await page.waitForTimeout(250);
    });

    /* Block: collapse and expand */
    test("Should collapse, then expand", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-collapse", blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-expand", blockCenterCoord);
        await page.waitForTimeout(250);
    });

    /* Block: duplicate a block */
    test("Should duplicate a block", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-duplicate", blockCenterCoord);
        await page.waitForTimeout(250);
    });

    /* Block: show help for a block */
    test("Should show help for a block", async ({ page }) => {
        await selectBlock(page, blockCenterCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-help", blockCenterCoord);
        await page.waitForTimeout(250);
    });
    /*-----------------------------------------------------------------*/
    /* Above tests for BLOCK MENU */
    /*-----------------------------------------------------------------*/

    /* Multiselect: cleanup selected */
    test("Should cleanup selected blocks", async ({ page }) => {
        await selectRegion(page, selectRectStartCoord, selectRectEndCoord);
        await selectMenuItem(page, "span#ms-menuitem-cleanup", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: comment and uncomment selected */
    test("Should comment and uncomment selected blocks", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-comment", workspaceEmptyCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-uncomment", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: copy and paste selected */
    test("Should copy and paste selected blocks", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-copy", workspaceEmptyCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-paste", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: delete selected */
    test("Should delete selected blocks", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-delete", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: duplicate selected */
    test("Should duplicate selected blocks", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-duplicate", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: external and inline selected */
    test("Should collapse and expand selected blocks", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-external", workspaceEmptyCoord);
        await page.waitForTimeout(250);
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-inline", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: undo and redo */
    /* Multiselect: reset */
    /* Multiselect: select all */

    /* Multiselect: set undeletable and deletable */
    test("Should set undeletable and deletable", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-set-undeletable", workspaceEmptyCoord);
        await page.waitForTimeout(250);
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-set-deletable", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: set uneditable and editable */
    test("Should set uneditable and editable", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-set-uneditable", workspaceEmptyCoord);
        await page.waitForTimeout(250);
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-set-editable", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Multiselect: set unmovable and movable */
    test("Should set unmovable and movable", async ({ page }) => {
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-set-unmovable", workspaceEmptyCoord);
        await page.waitForTimeout(250);
        await selectRegion(page, { x: 180, y: 40 }, { x: 500, y: 400 });
        await selectMenuItem(page, "span#ms-menuitem-set-movable", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });
    /*-----------------------------------------------------------------*/
    /* Above tests for MULTISELECT MENU */
    /*-----------------------------------------------------------------*/

    /* Workspace: cleanup all */
    test("Should cleanup all blocks", async ({ page }) => {
        await selectMenuItem(page, "span#ms-menuitem-cleanup-all", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Workspace: collapse and expand all */
    test("Should collapse and expand all blocks", async ({ page }) => {
        await selectMenuItem(page, "span#ms-menuitem-collapse-all", workspaceEmptyCoord);
        await page.waitForTimeout(250);
        await selectMenuItem(page, "span#ms-menuitem-expand-all", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Workspace: delete all */
    test("Should delete all blocks", async ({ page }) => {
        await selectMenuItem(page, "span#ms-menuitem-delete-all", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });

    /* Workspace: undo and redo */
    /* Workspace: reset */
    /* Workspace: select all */

    /* Workspace: delete all */
    test("Should show general help", async ({ page }) => {
        await selectMenuItem(page, "span#ms-menuitem-help", workspaceEmptyCoord);
        await page.waitForTimeout(250);
    });
    /*-----------------------------------------------------------------*/
    /* Above tests for MULTISELECT MENU */
    /*-----------------------------------------------------------------*/
});

async function selectBlock(page: Page, blockPos: { x: number; y: number }) {
    await page.keyboard.down("Shift");
    await page.mouse.click(blockPos.x, blockPos.y, { button: "left" });
    await page.keyboard.up("Shift");
}

async function selectRegion(page: Page, startXY: { x: number; y: number }, endXY: { x: number; y: number }) {
    await page.mouse.move(startXY.x, startXY.y, { steps: 1 });
    await page.keyboard.down("Shift");
    await page.mouse.down({ button: "left" });
    await page.mouse.move(endXY.x, endXY.y, { steps: 100 });
    await page.mouse.up();
    await page.keyboard.up("Shift");
}

async function selectMenuItem(page: Page, menuitemSelector: string, menuPos: { x: number; y: number }) {
    await page.click("div#blocklyDiv", { button: "right", position: menuPos });
    await page.waitForSelector(menuitemSelector);
    await page.waitForTimeout(250);
    await page.click(menuitemSelector);
}
