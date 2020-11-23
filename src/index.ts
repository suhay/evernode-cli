import path from 'path'
import fs from 'fs'
import * as rl from 'readline'
import os from 'os'
import { program } from 'commander'

import { client, getNotebooks } from './api'

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout
})

const homedir = os.homedir()
const pathToConfig = path.resolve(`${homedir}/.evernode`)

program
  .option('-l, --list', 'list all notebooks')
  .option('-i, --init', 'sets current directory as the notebook root')
  .option('-o, --open', 'opens the specified notebook and downloads all notes')
  .option('-s, --sync', 'syncs the current notebook directory, or updates notebook cache if within the notebook root'

program.version('0.0.1')

if (!fs.existsSync(`${pathToConfig}/.config`)) {
  readline.question('Personal token: ', token => {
    if (!fs.existsSync(pathToConfig)){
      fs.mkdirSync(pathToConfig, {
        mode: 0o700
      })
    }

    fs.writeFileSync(`${pathToConfig}/.config`, `TOKEN=${token}
SANDBOX=true`)
    readline.close()
  })
} else {
  program.parse(process.argv)
  const notebookClient = client()

  if (noteClient) {
    if (program.list) {
      getNotebooks(notebookClient)
        .finally(() => process.exit())
    }
  } else {
    process.exit()
  }
}
