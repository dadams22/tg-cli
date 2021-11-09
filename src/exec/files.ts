import * as os from 'os';
import * as path from 'path';

export const getPlatformExecutable = () => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin':
      return 'Contents/MacOS/Testgram'
    case 'linux':
      return 'Testgram'
    case 'win32':
      return 'Testgram.exe'
    // TODO handle this error using our standard
    default:
      throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

export const getPlatFormBinaryFolder = () => {
  const platform = os.platform()

  switch (platform) {
    case 'darwin':
      return 'Testgram.app'
    case 'linux':
      return 'Testgram'
    case 'win32':
      return 'Testgram'
    default:
      throw new Error(`Platform: "${platform}" is not supported.`)
  }
}

export const getPathToExecutable = (folder: string = getPlatFormBinaryFolder()) => {
  return path.join(folder, getPlatformExecutable())
}