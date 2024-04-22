// Needed to import css files in typescript
declare module '*.css' {
    const value: string;
    export default value
}