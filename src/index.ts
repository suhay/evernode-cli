import path from 'path'
import fs from 'fs'
import * as rl from 'readline'
import os from 'os'
import { program } from 'commander'

import { client, listNotebooks } from './api'

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout
})

const homedir = os.homedir()
const pathToConfig = path.resolve(`${homedir}/.evernode`)

program
  .option('-l, --list', 'list all notebooks')

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
  const noteClient = client()

  if (noteClient) {
    if (program.list) {
      listNotebooks(noteClient)
    }
  } else {
    process.exit()
  }
}
