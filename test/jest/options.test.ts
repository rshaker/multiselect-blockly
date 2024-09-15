import { OptionsMgr, defaultOptions } from "../../src/options";

describe("OptionsMgr", () => {
    let optionsMgr: OptionsMgr;

    beforeAll(() => {
        optionsMgr = OptionsMgr.getInstance();
    });

    beforeEach(() => {
        optionsMgr.resetOptions();
    });

    it("should initialize with default options", () => {
        const options = optionsMgr.getOptions();
        expect(options).toEqual(defaultOptions);
    });

    it("should return the singleton instance", () => {
        const instance1 = OptionsMgr.getInstance();
        const instance2 = OptionsMgr.getInstance();
        expect(instance1).toBe(instance2);
    });

    it("should set new options and merge with existing options", () => {
        const newOptions = {
            copyPasteToStorage: false,
            blockScope: {
                deletable: false,
            },
        };
        optionsMgr.setOptions(newOptions);
        const updatedOptions = optionsMgr.getOptions();
        expect(updatedOptions.copyPasteToStorage).toBe(false);
        expect(updatedOptions.blockScope?.deletable).toBe(false);
        expect(updatedOptions.blockScope?.comment).toBe(true); // Ensure existing properties are retained
    });

    it("should handle nested option merging correctly for blockScope", () => {
        const newOptions = {
            blockScope: {
                deletable: false,
                editable: true,
            },
        };
        optionsMgr.setOptions(newOptions);
        const updatedOptions = optionsMgr.getOptions();
        expect(updatedOptions.blockScope?.deletable).toBe(false);
        expect(updatedOptions.blockScope?.editable).toBe(true);
        expect(updatedOptions.blockScope?.comment).toBe(true); // Ensure existing properties are retained
    });

    it("should handle deep merging correctly for multiselectScope", () => {
        const newOptions = {
            multiselectScope: {
                cleanup: false,
                redo: true,
            },
        };
        optionsMgr.setOptions(newOptions);
        const updatedOptions = optionsMgr.getOptions();
        expect(updatedOptions.multiselectScope?.cleanup).toBe(false);
        expect(updatedOptions.multiselectScope?.redo).toBe(true);
    });

    it("should set new options by merging them with existing options", () => {
        const newOptions = {
            version: "2.0.0",
            copyPasteToStorage: false,
            blockScope: {
                comment: false,
            },
            workspaceScope: {
                cleanup: false,
            },
        };
        optionsMgr.setOptions(newOptions);
        const expectedOptions = defaultOptions;
        expectedOptions.version = "2.0.0";
        expectedOptions.copyPasteToStorage = false;
        expectedOptions.blockScope!.comment = false;
        expectedOptions.workspaceScope!.cleanup = false;
        const options = optionsMgr.getOptions();
        expect(options).toEqual(expectedOptions);
    });
});
