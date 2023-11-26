import { type Prompt, type Prettify } from '@inquirer/type';
export type AsyncPromptConfig = {
    message: string | Promise<string> | (() => Promise<string>);
};
export type PromptConfig<Config> = Prettify<AsyncPromptConfig & Config>;
type ResolvedPromptConfig = {
    message: string;
};
type ViewFunction<Value, Config> = (config: Prettify<Config & ResolvedPromptConfig>, done: (value: Value) => void) => string | [string, string | undefined];
export declare function createPrompt<Value, Config extends AsyncPromptConfig>(view: ViewFunction<Value, Config>): Prompt<Value, Config>;
export {};
