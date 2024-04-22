export function deepMerge(target: object, source: object): object {
    // Iterate over all properties in the source object
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            // Check if the value is an object and not null (typeof null === "object")
            if (typeof source[key] === "object" && source[key] !== null) {
                // If the target doesn't have the key, create an empty object
                if (!target[key]) target[key] = {};
                // Recursively merge the nested object
                deepMerge(target[key], source[key]);
            } else {
                // If the value is not an object, directly assign it to the target object
                target[key] = source[key];
            }
        }
    }
    return target;
}

export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;


