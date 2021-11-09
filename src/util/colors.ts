import * as chalk from 'chalk';

// Theming for Testgram

export const pink = chalk.hex("#D45CEF");
export const lightblue = chalk.hex("#50AEFF");
export const red = chalk.hex("#D7506F");
export const blurple = chalk.hex("#6F77FF");
export const green = chalk.green;
export const regular = chalk;
export const dim = chalk.dim;

export const colors = {
  accent: pink,
  debug: lightblue,
  error: red,
  success: green,
  log: regular,
  info: blurple,
  dim: chalk.dim
}

export const logger = {
  error(name: string, message: string) {
    console.log(colors.error.bold(name), colors.dim(message))
  }
}
