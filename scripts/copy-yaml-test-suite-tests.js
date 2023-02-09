import { execaCommand } from 'execa'
import { createHash } from 'node:crypto'
import { copyFile, readdir, readFile, rm } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPOSITORY = 'https://github.com/yaml/yaml-test-suite'
const COMMIT = '0008afd910392b061bdccd401748e0c25e774d76'

const getTestName = (rootFolder, line) => {
  return (
    'yaml-test-suite-' +
    line
      .slice(rootFolder.length + 1)
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replaceAll('\\', '-')
      .replaceAll('_', '-')
      .replaceAll(/\-+/g, '-')
      .replace('.yml', '.yaml')
  )
}

const getAllTests = async (rootFolder) => {
  const allTests = []
  const dirents = await readdir(rootFolder, { withFileTypes: true })
  for (const dirent of dirents) {
    const filePath = `${rootFolder}/${dirent.name}`
    const name = getTestName(rootFolder, filePath)
    const destinationPath = join(root, 'test', 'cases', name)
    allTests.push({ filePath, destinationPath })
  }
  return allTests
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPOSITORY} .tmp/yaml-test-suite`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/yaml-test-suite`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  const allTests = await getAllTests(`${root}/.tmp/yaml-test-suite/src`)
  for (const test of allTests) {
    await copyFile(test.filePath, test.destinationPath)
  }
}

main()
