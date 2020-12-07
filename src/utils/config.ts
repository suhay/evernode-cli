import dotenv from 'dotenv'
import fs from 'fs'
import os from 'os'
import path from 'path'
import readline from 'readline'

const homedir = os.homedir()
const pathToConfig = path.resolve(`${homedir}/.evernode`)
const isSandBox = true

dotenv.config({
  path: `${pathToConfig}/.config`
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const askForToken = () => {
  return new Promise<string>((resolve) => {
    rl.question('Evernote access token (leave blank to enter an API key instead): ', (answer) => {
      resolve(answer)
    })
  })
}

const askForKey = () => {
  return new Promise<string>((resolve, reject) => {
    rl.question('Evernote API key: ', (answer) => {
      if (answer === '') {
        reject('Evernote token or API key, we need one or the other.')
      } else {
        resolve(answer)
      }
    })
  })
}

const askForSecret = () => {
  return new Promise<string>((resolve, reject) => {
    rl.question('Evernote API secret: ', (answer) => {
      if (answer === '') {
        reject('We need a secret to go with the API key.')
      } else {
        resolve(answer)
      }
    })
  })
}

export interface Config {
  SANDBOX?: boolean
  TOKEN?: string
  KEY?: string
  SECRET?: string
}

export const getConfig = () => {
  const { TOKEN: token, SANDBOX, KEY: consumerKey, SECRET: consumerSecret } = process.env
  const sandbox = Boolean(SANDBOX ?? isSandBox)

  return {
    token,
    consumerKey,
    consumerSecret,
    sandbox
  }
}

export const saveConfig = (parts: Config) => {
  const configVal = Object.entries(parts)
    .filter((val) => val[1] !== '')
    .map((val) => `${val[0]}=${val[1]}`)
    .join('\n')

  fs.writeFileSync(`${pathToConfig}/.config`, configVal)
}

export const config = () => {
  return new Promise<void>(async (resolve, reject) => {
    if (!fs.existsSync(`${pathToConfig}/.config`)) {
      if (!fs.existsSync(pathToConfig)){
        fs.mkdirSync(pathToConfig, {
          mode: 0o700
        })
      }
  
      const parts: Config = {
        SANDBOX: true,
        TOKEN: await askForToken()
      }
  
      if (parts.TOKEN) {
        saveConfig(parts)
        rl.close()
        reject('Token saved!')
      } else {
        return askForKey()
          .then((val) => {
            parts.KEY = val
            return askForSecret()
          })
          .then((val) => {
            parts.SECRET = val
            saveConfig(parts)
            reject('Credentials saved!')
          })
          .catch((err) => {
            console.error(err)
            reject()
          })
          .finally(() => {
            rl.close()
          })    
      }
    } else {
      resolve()
    }
  })
}