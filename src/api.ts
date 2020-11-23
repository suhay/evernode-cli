import os from 'os'
import Evernote from 'evernote'
import dotenv from 'dotenv'

const homedir = os.homedir()

dotenv.config({
  path: `${homedir}/.evernode/.config`
})

export const client = () => {
  const { TOKEN: token, SANDBOX } = process.env
  const sandbox = Boolean(SANDBOX ?? false)

  return token
    ? new Evernote.Client({
        token,
        sandbox,
        china: false,
      })
    : null
}

export const getNotebooks = (client: Evernote.Client) => {
  const noteStore = client.getNoteStore()

  return noteStore?.listNotebooks()
    .then((notebooks) => notebooks)
    .catch((err) => {
      console.error(err)
    })
}

export const setRoot = (client: Evernote.Client) => {
  // Create directory if not already exists
  // Grab all notebooks and cache them in the created directory
}

export const openNotebook = (client: Evernote.Client, notebookName: string) => {
  // Create folder based upon notebook name
  // Create .evernode directory within notebook
  // If cuurently in the root directory:
    // Look up GUID from root .evernode directory
    // Save it within the local .evernode directory
    // Pull in all notes
  // If not in the current root
    // Call out to getNotebooks and see if we can find a guid
    // Save it to the local .evernode directory
    // Or we tell the user they need to either create the root, and or sync it
}

const export sync = (client: Evernote.Client) => {
  // If in root
    // Sync all norebook guids
  // If in notebook
    // Grad guid from .evernode directory
    // Push up and pull down
}
