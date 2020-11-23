import os from 'os'
import Evernote from 'evernote'
import dotenv from 'dotenv'

const homedir = os.homedir()

dotenv.config({
  path: `${homedir}/.evernode/.config`
})

export const client = () => {
  const { TOKEN: token, SANDBOX } = process.env
  const sandbox = Boolean(SANDBOX)

  return token && sandbox 
    ? new Evernote.Client({
        token,
        sandbox,
        china: false,
      })
    : null
}

export const listNotebooks = async (client: Evernote.Client) => {
  const noteStore = client.getNoteStore()

  noteStore?.listNotebooks()
    .then((notebooks) => {
      console.log(notebooks)
    })
    .catch((err) => {
      console.error(err)
    })
    .finally(() => process.exit())
}
