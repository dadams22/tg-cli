import * as fs from 'fs';
import * as path from 'path';

/*
 Copied from the original find-up repo in order to get around the cjs requirements
 */

export const findUpStop = Symbol('findUpStop');

export interface Options {
  /**
   The current working directory.
   @default process.cwd()
   */
  readonly cwd?: string;

  /**
   The type of path to match.
   @default 'file'
   */
  readonly type?: 'file' | 'directory';

  /**
   Allow symbolic links to match if they point to the requested path type.
   @default true
   */
  readonly allowSymlinks?: boolean;

  /**
   The path to the directory to stop the search before reaching root if there were no matches before the `stopAt` directory.
   @default path.parse(cwd).root
   */
  readonly stopAt?: string;

  readonly limit?: number
}


export function findUpSync(name, options = {}) {
  const matches = findUpMultipleSync(name, { ...options, limit: 1 });
  return matches[0];
}

export function findUpMultipleSync(name: string | readonly string[], options?: Options) {
  let directory = path.resolve(options.cwd || '');
  const { root } = path.parse(directory);
  const stopAt = options.stopAt || root;
  const limit = options.limit || Number.POSITIVE_INFINITY;
  const paths = [name].flat();

  const runMatcher = locateOptions => {
    if (typeof name !== 'function') {
      return locatePathSync(paths, locateOptions);
    }

    //@ts-ignore
    const foundPath = name(locateOptions.cwd);
    if (typeof foundPath === 'string') {
      return locatePathSync([foundPath], locateOptions);
    }

    return foundPath;
  };

  const matches = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const foundPath = runMatcher({ ...options, cwd: directory });

    if (foundPath === findUpStop) {
      break;
    }

    if (foundPath) {
      matches.push(path.resolve(directory, foundPath));
    }

    if (directory === stopAt || matches.length >= limit) {
      break;
    }

    directory = path.dirname(directory);
  }

  return matches;
}

const typeMappings = {
  directory: 'isDirectory',
  file: 'isFile',
};

function checkType(type) {
  if (type in typeMappings) {
    return;
  }

  throw new Error(`Invalid type specified: ${type}`);
}

const matchType = (type, stat) => type === undefined || stat[typeMappings[type]]();

function locatePathSync(
  paths,
  {
    cwd = process.cwd(),
    type = 'file',
    allowSymlinks = true,
  } = {},
) {
  checkType(type);

  const statFunction = allowSymlinks ? fs.statSync : fs.lstatSync;

  for (const path_ of paths) {
    try {
      const stat = statFunction(path.resolve(cwd, path_));

      if (matchType(type, stat)) {
        return path_;
      }
    } catch {
    }
  }
}