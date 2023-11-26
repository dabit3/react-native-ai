/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import * as readline from 'node:readline';
import MuteStream from 'mute-stream';
export type InquirerReadline = readline.ReadLine & {
    output: MuteStream;
    input: NodeJS.ReadableStream;
    clearLine: (dir: 0 | 1 | -1) => void;
};
