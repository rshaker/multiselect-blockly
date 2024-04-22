import { assert } from "chai";
import { MultiselectPlugin } from "../../src/plugin";
import { getOptions } from "../../src/menus";
import { CombinedScope, PluginFlags, MultiScopeFlagKeys, WorkspaceScopeFlagKeys, BlockScopeFlagKeys } from "../../src/types";
import * as Blockly from "blockly";

// These are just filler tests until I get around to writing real ones

describe("context-menus", function() {
    let plugin: MultiselectPlugin;
    let scope: CombinedScope;

    before(() => {
        const options: PluginFlags = {};
        plugin = new MultiselectPlugin(options, null, null);
    });

    it("should return expected options for BlockScope", () => {
        scope = { block: Object.create(Blockly.BlockSvg.prototype) };
        for (const optionName in BlockScopeFlagKeys) {
            const options = getOptions(plugin, scope, optionName);
            options.map(option => {
                assert.isString(option.text);
                assert.isBoolean(option.enabled);
                assert.isFunction(option.callback);
            });
        }
    });

    it("should return expected options for WorkspaceScope", () => {
        // Create a WorkspaceSvg object without calling its constructor
        scope = { workspace: Object.create(Blockly.WorkspaceSvg.prototype) };
        for (const optionName in WorkspaceScopeFlagKeys) {
            const options = getOptions(plugin, scope, optionName);
            options.map(option => {
                assert.isString(option.text);
                assert.isBoolean(option.enabled);
                assert.isFunction(option.callback);
            });
        }
    });

    it("should return expected options for MultiScope", () => {
        scope = { multiselect: [] };
        for (const optionName in MultiScopeFlagKeys) {
            const options = getOptions(plugin, scope, optionName);
            options.map(option => {
                assert.isString(option.text);
                assert.isBoolean(option.enabled);
                assert.isFunction(option.callback);
            });
        }
    });
});