
# multiselect-blockly 

[![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that allows for simultaneous selection and manipulation of multiple top-level blocks. Common operations include copy, paste, delete, duplicate, expand, collapse, inline, arrange--The usual Blockly actions, but for more than *one* block. Block settings such as movable, editable, and deletable may also be toggled on or off using the the same set of context menu actions.

To activate multiselect mode, shift-click on a block *or* use the rectangular selection tool (shift-click-drag on background). Selected blocks will appear grey. Clicking on the background or any unselected block will deactivate multiselect mode.

<img src="https://gist.github.com/assets/448495/89b6415c-ba35-49b4-894d-f4f13871f8f7">

## Installation

### npm
```bash
npm install @rshaker/multiselect-blockly
```

### unpkg
```html
<script src="https://unpkg.com/@rshaker/multiselect-blockly/dist/multiselect.js"></script>
```

## Usage

The following examples show how to inject the plugin into a Blockly workspace.

### Using node:

```js
import * as Blockly from "blockly/core";
import { MultiselectPlugin } from "@rshaker/multiselect-blockly";

const workspace = Blockly.getMainWorkspace();
const plugin = new MultiselectPlugin({}, workspace);

plugin.init();
```

See [test/workspace/index.ts](https://github.com/rshaker/multiselect-blockly/blob/main/test/workspace/index.ts) for a complete example, the live demo is [here](https://rshaker.github.io/multiselect-blockly/test/workspace).

### Using a browser:

```html
<div id="blocklyDiv"></div>

<script src="https://unpkg.com/blockly/blockly.min.js"></script>
<script src="https://unpkg.com/@rshaker/multiselect-blockly/dist/multiselect.js"></script>

<script>
  function createWorkspace(blocklyDiv, options) {
    const pluginOptions = {
      hideDisabledMenuItems: true, // `false` greys out disabled menu options, `true` hides them
    };
    const workspace = Blockly.inject(blocklyDiv, options);
    const plugin = new multiselect.MultiselectPlugin(
      pluginOptions,
      workspace,
    );
    plugin.init();

    return workspace;
  }

  document.addEventListener("DOMContentLoaded", function () {
    const toolbox = {
      kind: "flyoutToolbox",
      contents: [
        {
          kind: "block",
          type: "controls_if",
        },
      ],
    };

    createWorkspace(document.getElementById("blocklyDiv"), {
      toolbox: toolbox,
    });
  });
</script>
```
See [test/browser/unpkg-plugin.html](https://github.com/rshaker/multiselect-blockly/blob/main/test/browser/unpkg-plugin.html) for a complete example, the live demo is <a href="https://rshaker.github.io/multiselect-blockly/test/browser/unpkg-plugin.html">here</a>.

## Compatibility

This plugin is currently compatible only with the most recent versions of Chrome. I hope to add testing for Edge, Safari and Firefox shortly, this package is still under active development, expect instability and bugs.

## License
MIT


