
# multiselect-blockly 

[![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

A [Blockly](https://www.npmjs.com/package/blockly) plugin that allows for simultaneous selection and manipulation of multiple top-level blocks. Operations include: copy, paste, delete, duplicate, expand, collapse, inline, arrange, toggle a block's movability, editability, deletability, etc ...

To activate multiselect mode, either shift-click on a block *or* use the rectangular selection tool (shift-click-drag). Clicking on the background or any unselected block will exit multiselect mode.

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
TBW
```

See [test/workspace/index.ts](test/workspace/index.ts) for another node example, the live demo is [here](https://rshaker.github.io/multiselect-blockly/test/workspace).

### Using a browser:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>browser test</title>
    <style>
      html, body {
        margin: 0;
      }
      #blocklyDiv {
        height: 100vh;
        width: 100vw;
      }
    </style>
  </head>
  <body>
    <div id="blocklyDiv"></div>

    <script src="https://unpkg.com/blockly/blockly.min.js"></script>
    <script src="https://unpkg.com/@rshaker/multiselect-blockly/dist/multiselect.js"></script>
    <!-- For local development use <script defer src="dist/multiselect.js"></script> -->

    <script>
      function createWorkspace(blocklyDiv, options) {
        const pluginOptions = {
          copyPasteToStorage: true,     // Use local storage for cross-tab & between-session persistance
          copyPasteToClipboard: true,   // `false` prevents use of system clipboard
          hideDisabledMenuItems: false, // `false` greys out disabled menu options, `true` hides them
          enableBlockMenu: true,        // Enable custom block menu (multiselect mode only)
          enableWorkspaceMenu: true,    // Enable custom workspace menu (single-select mode only)
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
            {
              kind: "block",
              type: "controls_whileUntil",
            },
          ],
        };

        createWorkspace(document.getElementById("blocklyDiv"), {
          toolbox: toolbox,
        });
      });
    </script>
  </body>
</html>
```

## Compatibility

This plugin is currently compatible only with the most recent versions of Chromium-based browsers. I hope to add testing for Safari and Firefox shortly, this package is still under active development, expect instability.

## License
MIT


