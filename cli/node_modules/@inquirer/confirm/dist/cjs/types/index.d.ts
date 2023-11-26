declare const _default: import("@inquirer/type").Prompt<boolean, {
    message: string | Promise<string> | (() => Promise<string>);
    default?: boolean | undefined;
    transformer?: ((value: boolean) => string) | undefined;
}>;
export default _default;
