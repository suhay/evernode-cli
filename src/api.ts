import Evernote from 'evernote'
import express from 'express'
import op from 'open'

import { 
  saveConfig, 
  getConfig, 
  saveNotebooks, 
  isRoot, 
  getNotebookRoot, 
  setNotebookGuid, 
  getNotebookGuid, 
  getNotes,
  saveNotes, 
  saveNote,
  setNotebookRoot,
  isNotebook,
  Note,
  getNoteContent,
  applyTemplate,
  getNoteUpdateTime
} from './utils'

const callbackServer = async (resolve: any) => {
  const app = express()

  app.get('/oauth_callback', (req, res) => {
    resolve(req.query);
    res.end('')
  })

  return await app.listen(3000)
}

export const client = (sandbox: boolean = false) => {
  const { token, consumerKey, consumerSecret } = getConfig()

  if (token) { // If we have a straight up auth token, let's just use it.
    return Promise.resolve(
      new Evernote.Client({
        token,
        sandbox,
        china: false,
      })
    )
  }

  const callbackUrl = "http://localhost:3000/oauth_callback"

  const unAuthClient = new Evernote.Client({
    consumerKey,
    consumerSecret,
    sandbox,
    china: false,
  });

  return new Promise<Evernote.Client>((res, rej) => {
    unAuthClient.getRequestToken(callbackUrl, async (error, oToken, oTokenSecret) => {
      if (error) {
        rej(`error: ${error.statusCode}`)
      }

      const oauthToken = oToken
      const oauthTokenSecret = oTokenSecret

      let resolve: any
      const p = new Promise<any>((_resolve) => {
        resolve = _resolve
      });

      await callbackServer(resolve)
        .then(async (server) => {
          op(unAuthClient.getAuthorizeUrl(oauthToken))

          const code = await p

          unAuthClient.getAccessToken(
            oauthToken, 
            oauthTokenSecret, 
            code.oauth_verifier,
            async (error, accessToken) => {
              await server.close()

              if (error) {
                rej(`error: ${error.statusCode}`)
              }

              saveConfig({
                TOKEN: accessToken,
                KEY: consumerKey,
                SECRET: consumerSecret,
              })

              res(new Evernote.Client({
                token: accessToken,
                sandbox,
                china: false,
              }))
            }
          )
        })
    })
  })
}

export const listNotebooks = (client: Evernote.Client) => {
  const noteStore = client.getNoteStore()
  return noteStore?.listNotebooks()
}

export const setRoot = (client: Evernote.Client) => {
  setNotebookRoot()

  return listNotebooks(client)
    .then((notebooks) => {
      saveNotebooks(notebooks)
      return 'Root set'
    })
}

export const listNotes = (client: Evernote.Client, notebookGuid?: string) => {
  const noteStore = client.getNoteStore()
  const guid = notebookGuid || getNotebookGuid()

  if (guid) {
    const filter = new Evernote.NoteStore.NoteFilter()
    filter.notebookGuid = guid

    const spec = new Evernote.NoteStore.NotesMetadataResultSpec()
    spec.includeTitle = true
    spec.includeUpdateSequenceNum = true
    spec.includeUpdated = true

    return noteStore.findNotesMetadata(filter, 0, 100, spec)
  }

  return Promise.reject('Unable to find this notebook\'s notes')
}

export const openNotebook = (client: Evernote.Client, notebookName: string) => {
  if (!isRoot()) {
    return Promise.reject('You are not currently in a notebook root')
  }

  const root = getNotebookRoot()

  if (!root) {
    return Promise.reject('Unable to find the nearest notebook root')
  }

  let guid: string | undefined
  let name: string | undefined

  if (Number.isInteger(parseInt(notebookName, 10))) {
    const notebookIdx = parseInt(notebookName, 10)
    guid = root[notebookIdx - 1]?.guid
    name = root[notebookIdx - 1]?.name
  } else {
    const notebook = root.find((notebook) => notebook.name === notebookName)
    guid = notebook?.guid
    name = notebook?.name
  }

  if (guid && name) {
    setNotebookGuid(guid, name)

    return listNotes(client, guid)
      .then((notes) => {
        saveNotes(notes, name)
        return 'Notebook opened'
      })
  } else {
    return Promise.reject('We weren\'t able to find that notebook, please check the spelling or run `sync` in the notebook root to update the available list')
  }
}

export const openNote = (client: Evernote.Client, noteName: string) => {
  if (!isNotebook()) {
    return Promise.reject('You are not currently in a notebook')
  }

  const notebook = getNotes()

  if (!notebook) {
    return Promise.reject('Unable to find the nearest notebook')
  }

  let guid: string | undefined
  let title: string | undefined

  if (Number.isInteger(parseInt(noteName, 10))) {
    const noteIdx = parseInt(noteName, 10)
    guid = notebook[noteIdx - 1]?.guid
    title = notebook[noteIdx - 1]?.title
  } else {
    const note = notebook.find((note) => note.title === noteName)
    guid = note?.guid
    title = note?.title
  }

  const noteStore = client.getNoteStore()

  if (guid && title) {
    const spec = new Evernote.NoteStore.NoteResultSpec()
    spec.includeContent = true

    return noteStore.getNoteWithResultSpec(guid, spec)
      .then((note) => {
        saveNote(note)
        return 'Note opened'
      })
  } else {
    return Promise.reject('We weren\'t able to find that note, please check the spelling or run `sync` in the notebook to update the available list')
  }
}

export const updateNote = (client: Evernote.Client, note: Note) => {
  const noteStore = client.getNoteStore()

  const spec = new Evernote.NoteStore.NoteResultSpec()
  spec.includeContent = true

  return noteStore.getNoteWithResultSpec(note.guid, spec)
      .then((remoteNote) => {
        if ((remoteNote.updateSequenceNum ?? 1) > (note.updateSequenceNum ?? 0)) { // Remote was more up to date
          saveNote(remoteNote)
        } else {
          const updatedNote: Evernote.Types.Note = {
            content: getNoteContent(note),
            guid: note.guid,
            title: note.title
          }

          if (getNoteUpdateTime(note) > (remoteNote?.updated ?? 0)) {
            return noteStore.updateNote(updatedNote)
              .then((updatedNote) => {
                delete updatedNote.content
                saveNote(updatedNote)
              })
          }
        }
      })
      .then(() => {
        return 'Note synced'
      })
}

export const createNote = (client: Evernote.Client, noteName: string) => {
  const noteStore = client.getNoteStore()

  const newNote: Evernote.Types.Note = {
    content: applyTemplate(''),
    title: noteName
  }

  return noteStore.createNote(newNote)
    .then((note) => {
      saveNote(note, true)
      return 'Note created'
    })
}
