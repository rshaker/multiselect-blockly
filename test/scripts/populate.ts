import * as Blockly from "blockly/core";
import * as puppeteer from "puppeteer";
import * as fs from "fs/promises";
import * as path from "path";
import { program } from "commander";

let browser: puppeteer.Browser;
let page: puppeteer.Page;

main();

async function main() {
    program
        .option("-n, --number <count>", "number of blocks to generate", "50")
        .option("-o, --output <filename>", "output filename (.json)", "../fixtures/blocks.json")
        .option("-p, --page <filename>", "page filename (.html)", "../workspace/index.html");
    program.parse(process.argv);
    const options = program.opts();

    browser = await puppeteer.launch({
        headless: true,
        // userDataDir: "./tmp/puppeteer",
        // devtools: true,
    });

    page = await browser.newPage();
    await page.setViewport({
        width: 1000,
        height: 800,
        deviceScaleFactor: 1,
    });

    // Load the testing workspace
    await page.goto("file://" + path.join(__dirname, options["page"]));

    // Wait for the Blockly"s background to be present
    const backgroundSelector = ".blocklyMainBackground";
    await page.waitForSelector(backgroundSelector);

    // Generate a workspace of random blocks
    page.exposeFunction("populateRandomBlocks", populateRandomBlocks);
    const wsData = await page.evaluate(populateRandomBlocks, parseInt(options["number"]));

    // Save the workspace data to a file
    const filename = path.join(__dirname, options["output"]);
    await fs.writeFile(filename, wsData, "utf8");

    await page.close();
    await browser.close();
}

function populateRandomBlocks(numBlocks: number): Promise<string> {
    // Get the existing workspace and populate it with random blocks
    const workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;

    // Get names of all blocks in Blockly.Blocks that have their own `init` property
    const names = Object.keys(Blockly.Blocks).filter((name) =>
        Object.prototype.hasOwnProperty.call(Blockly.Blocks[name], "init")
    );

    // const boundsList: { blockSvgId: string; bounds: DOMRect }[] = [];
    for (let i = 0; i < numBlocks; i++) {
        // Randomly pick block type to create
        const name = names[Math.floor(Math.random() * names.length)];
        const block = workspace.newBlock(name);
        block.initSvg();

        // Randomly position the new block
        block
            .getSvgRoot()
            .setAttribute(
                "transform",
                `translate(${Math.round(Math.random() * (1000 - 1 - 200))}, ${Math.round(Math.random() * (800 - 1 - 200))})`
            );
        block.render();

        // Randomly set block properties
        block.setCollapsed(Math.random() > 0.5);
        block.setInputsInline(Math.random() > 0.5);

        // boundsList.push({
        //     blockSvgId: block.id,
        //     bounds: block.getSvgRoot().getBoundingClientRect(),
        // });
    }

    // Serialize the workspace to JSON and return it
    const wsData = JSON.stringify(Blockly.serialization.workspaces.save(workspace), null, 4);
    return Promise.resolve(wsData);
}
