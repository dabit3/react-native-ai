import { type InquirerReadline } from './read-line.type.mjs';
import { type KeypressEvent } from './key.mjs';
export declare function useKeypress(userHandler: (event: KeypressEvent, rl: InquirerReadline) => void): void;
