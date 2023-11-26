import { type InquirerReadline } from './read-line.type.js';
import { type KeypressEvent } from './key.js';
export declare function useKeypress(userHandler: (event: KeypressEvent, rl: InquirerReadline) => void): void;
