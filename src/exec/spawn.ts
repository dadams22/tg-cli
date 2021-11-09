import { getPathToExecutable } from './files.js';
import * as cp from 'child_process';
import * as path from 'path';

spawn()

function spawn(
  args: string[] = process.argv.slice(2)
) {
  // TODO: make this driven by the cachedir
  let executable = path.join("/Users/koratana/testgram/app/dist/mac-arm64", getPathToExecutable());

  args.push("--cwd")
  args.push(process.cwd())

  const child = cp.spawn(executable, args, {
    stdio: 'inherit'
  })

  if (child.stdin) {
    process.stdin.pipe(child.stdin)
  }

  if (child.stdout) {
    child.stdout.pipe(process.stdout)
  }

  if (child.stderr) {
    child.stderr.pipe(process.stderr)
  }
}