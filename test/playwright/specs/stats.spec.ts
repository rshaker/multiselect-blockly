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
        
        // const recon = await doRecon(page);
        // console.log(JSON.stringify(recon));
    });

    // test("Should pause for no reason", async ({ page }) => {
    //     await page.waitForTimeout(250); // pause for no reason
    // });
});