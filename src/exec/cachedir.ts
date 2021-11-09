import os from 'os';
import path from 'path';

function posix(id: string) {
  const cacheHome = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache')
  return path.join(cacheHome, id)
}

function darwin(id: string) {
  return path.join(os.homedir(), 'Library', 'Caches', id)
}

function win32(id: string) {
  const appData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
  return path.join(appData, id, 'Cache')
}

export const cacheDir = (id: string = "Testgram"): string => {
  switch (os.platform()) {
    case 'darwin':
      return darwin(id)
    case 'win32':
      return win32(id)
    case 'linux':
      return posix(id)
    default:
      return posix(id)
  }
}