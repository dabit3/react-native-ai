"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Separator = void 0;
const chalk_1 = __importDefault(require("chalk"));
const figures_1 = __importDefault(require("figures"));
/**
 * Separator object
 * Used to space/separate choices group
 */
class Separator {
    constructor(separator) {
        Object.defineProperty(this, "separator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: chalk_1.default.dim(new Array(15).join(figures_1.default.line))
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'separator'
        });
        if (separator) {
            this.separator = separator;
        }
    }
    static isSeparator(choice) {
        return Boolean(choice && choice.type === 'separator');
    }
}
exports.Separator = Separator;
