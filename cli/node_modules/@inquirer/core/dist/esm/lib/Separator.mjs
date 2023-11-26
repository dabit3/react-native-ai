import chalk from 'chalk';
import figures from 'figures';
/**
 * Separator object
 * Used to space/separate choices group
 */
export class Separator {
    separator = chalk.dim(new Array(15).join(figures.line));
    type = 'separator';
    constructor(separator) {
        if (separator) {
            this.separator = separator;
        }
    }
    static isSeparator(choice) {
        return Boolean(choice && choice.type === 'separator');
    }
}
