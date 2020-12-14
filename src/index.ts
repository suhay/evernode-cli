import { program } from 'commander'
import Evernote from 'evernote'

import { 
  client,
  setRoot,
  openNotebook,
  openNote,
  listNotebooks,
  listNotes,
  updateNote,
  createNote
} from './api'
import { 
  config,
  getNote,
  isNotebook,
  isRoot,
  saveNotebooks,
  saveNotes
} from './utils'

program
  .version('0.1.0')
  .option('-i, --init', 'sets current directory as the notebook root')
  .option('-l, --list', 'list all notebooks')
  .option('-o, --open <name>', 'opens the specified notebook, or note, and downloads its metadata')
  .option('-n, --new <name>', 'creates a new note with the given name and syncs it to the notebook')
  .option('-s, --sync [note]', 'syncs the current notebook directory, or updates notebook cache if within the notebook root')

const init = (client: Evernote.Client) => {
  return setRoot(client)
}

const open = (client: Evernote.Client, name: string) => {
  if (isRoot()) {
    return openNotebook(client, name)
  } else if (isNotebook()) {
    return openNote(client, name)
  }

  return Promise.reject('Nothing here to open')
}

const list = (client: Evernote.Client) => {
  if (isRoot()) {
    return listNotebooks(client)
      .then((notebooks) => notebooks.map((notebook, i) => `${i + 1}: ${notebook.name}`).join('\n'))
  } else if (isNotebook()) {
    return listNotes(client)
      .then((list) => list.notes?.map((note, i) => `${i + 1}: ${note.title}`).join('\n'))
  }

  return Promise.reject('Nothing here to list')
}

const sync = (client: Evernote.Client, noteName?: boolean | string) => {
  if (noteName === true) {
    if (isRoot()) {
      console.log('Syncing notebook root...')

      return listNotebooks(client)
        .then((notebooks) => {
          saveNotebooks(notebooks)
          return 'Sync complete'
        })
    } else if (isNotebook()) {
      console.log('Syncing notebook...')

      return listNotes(client)
        .then((notes) => {
          saveNotes(notes)
          return 'Sync complete'
      })
    }
  } else if (typeof noteName === 'string') {
    const note = getNote(noteName)
    console.log('Syncing note...')

    return note 
      ? updateNote(client, note)
      : Promise.reject('Couldn\'t find a note with that name')
  }
  
  return Promise.reject('Nothing here to sync')
}

const create = (client: Evernote.Client, noteName: string) => {
  console.log(`Creating ${noteName}...`)
  return createNote(client, noteName)
}

const main = async () => {
  await config()
    .then(() => client())
    .then((authClient) => {
      program.parse(process.argv)

      if (authClient) {
        if (program.list) {
          return list(authClient)
        } else if (program.init) {
          return init(authClient)
        } else if (program.open && program.open !== '') {
          return open(authClient, program.open)
        } else if (program.sync) {
          return sync(authClient, program.sync)
        } else if (program.new && program.new !== '') {
          return create(authClient, program.new)
        }
      }

      return Promise.reject('There was an error trying to log into your account')
    })
    .then((result) => {
      console.log(result)
    })
    .catch((err) => {
      console.error(err)
    })
    .finally(() => process.exit())
}

main()
