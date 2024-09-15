import { deepMerge } from "./util";

/**
 * A type representing all possible option value types.
 */
type OptionValueType = boolean | number | string | undefined;

/**
 * An interface defining the structure of the options graph.
 */
interface OptionsStructure {
    [key: string]: OptionValueType | OptionsStructure;
}

/**
 * Restrict the keys and values allowed in options.
 */
export interface Options extends OptionsStructure {
    version?: string;
    copyPasteToStorage?: boolean;
    copyPasteToClipboard?: boolean;
    hideDisabledMenuItems?: boolean;
    enableBlockMenu?: boolean;
    enableWorkspaceMenu?: boolean;
    blockScope?: {
        comment?: boolean;
        copy?: boolean;
        deletable?: boolean;
        delete?: boolean;
        duplicate?: boolean;
        editable?: boolean;
        expand?: boolean;
        help?: boolean;
        inline?: boolean;
        movable?: boolean;
    };
    workspaceScope?: {
        cleanup?: boolean;
        delete?: boolean;
        expand?: boolean;
        help?: boolean;
        paste?: boolean;
        redo?: boolean;
        reset?: boolean;
        select?: boolean;
        undo?: boolean;
    };
    multiselectScope?: {
        cleanup?: boolean;
        comment?: boolean;
        copy?: boolean;
        deletable?: boolean;
        delete?: boolean;
        duplicate?: boolean;
        editable?: boolean;
        expand?: boolean;
        inline?: boolean;
        movable?: boolean;
        paste?: boolean;
        redo?: boolean;
        reset?: boolean;
        select?: boolean;
        undo?: boolean;
    };
}

export type BlockScope = Options["blockScope"];
export type WorkspaceScope = Options["workspaceScope"];
export type MultiScope = Options["multiselectScope"];

/**
 * Default options and their values, used by the whole application.
 * Call OptionsMgr.setOptions({...}) to add and change these values.
 */
export const defaultOptions: Options = {
    version: "1.2.3",
    copyPasteToStorage: true,
    copyPasteToClipboard: true,
    hideDisabledMenuItems: true,
    enableBlockMenu: true,
    enableWorkspaceMenu: true,
    blockScope: {
        comment: true,
        copy: true,
        deletable: true,
        delete: true,
        duplicate: true,
        editable: true,
        expand: true,
        help: true,
        inline: true,
        movable: true,
    },
    workspaceScope: {
        cleanup: true,
        delete: true,
        expand: true,
        help: true,
        paste: true,
        redo: true,
        reset: true,
        select: true,
        undo: true,
    },
    multiselectScope: {
        cleanup: true,
        comment: true,
        copy: true,
        deletable: true,
        delete: true,
        duplicate: true,
        editable: true,
        expand: true,
        inline: true,
        movable: true,
        paste: true,
        redo: true,
        reset: true,
        select: true,
        undo: true,
    },
};

/**
 * A singleton class for managing application options.
 */
export class OptionsMgr {
    /**
     * The singleton instance.
     */
    private static instance: OptionsMgr;

    /**
     * The options storage.
     */
    private options: Options = { ...defaultOptions };

    /**
     * Private constructor to prevent direct instantiation.
     */
    private constructor() {}

    /**
     * Returns the singleton instance of the OptionsMgr class.
     * If no instance exists, one is created.
     * @returns {OptionsMgr} The singleton instance.
     */
    public static getInstance(): OptionsMgr {
        if (!OptionsMgr.instance) {
            OptionsMgr.instance = new OptionsMgr();
        }
        return OptionsMgr.instance;
    }

    /**
     * Returns the current options.
     * @returns {Options} A copy of the current options.
     */
    public getOptions(): Options {
        return { ...this.options };
    }

    /**
     * Resets the options to default values.
     */
    public resetOptions(): void {
        this.options = { ...defaultOptions };
    }

    /**
     * Sets new options by merging 'new' with existing.
     * @param {Options} newOptions - The new options to be set.
     */
    public setOptions(newOptions: Options): void {
        this.options = deepMerge(this.options, newOptions) as Options;
    }

    /** 
     * Set nested option by path.
     * @param {string} path - The path to the nested option.
     * @param {OptionValueType} value - The value to set. 
     */
    public setNestedOption(path: string, value: OptionValueType): void {
        const keys = path.split(".");
        let current = this.options;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]] as OptionsStructure;
        }
        current[keys[keys.length - 1]] = value;
    }
}
