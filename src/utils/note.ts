import Evernote from 'evernote'
import fs from 'fs'
import TurndownService from 'turndown'
import marked from 'marked'

const template = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>{content}</en-note>`

export interface Note {
  title: string
  guid: string
  updateSequenceNum?: number
  updated?: number
}

export const toEnNote = (content: string) => {
  const html = marked(content, {
    headerIds: false
  })
  return template.replace(/{content}/gi, html)
}

export const toMarkdown = (content: string) => {
  const turndownService = new TurndownService()
  const md = content.replace(/.*?<en-note>(.*?)<\/en-note>/gs, '$1')
  return turndownService.turndown(md)
}

export const saveNotes = (list: Evernote.NoteStore.NotesMetadataList, notebook?: string) => {
  const cwd = `${process.cwd()}${notebook ? `/${notebook}` : ``}`

  const notes = list.notes?.map<Note>((note) => ({
    title: note.title ?? `untitled-${Date.now()}`,
    guid: note.guid ?? '',
    updateSequenceNum: note.updateSequenceNum,
    updated: note.updated
  }))
  
  fs.writeFileSync(`${cwd}/.evernode/.notes`, JSON.stringify(notes ?? []))
}

export const getNotes = (): Note[] | undefined => {
  const cwd = `${process.cwd()}`

  if (fs.existsSync(`${cwd}/.evernode/.notes`)) {
    return JSON.parse(fs.readFileSync(`${cwd}/.evernode/.notes`, 'utf-8'))
  }
  
  return undefined
}

export const saveNote = (note: Evernote.Types.Note, isNew?: boolean) => {
  const cwd = `${process.cwd()}`

  if (fs.existsSync(`${cwd}/.evernode/.notes`)) {
    const notes = JSON.parse(fs.readFileSync(`${cwd}/.evernode/.notes`, 'utf-8')) as Note[]
    
    if (isNew) {
      notes.push({
        title: note.title ?? '',
        guid: note.guid ?? '',
        updateSequenceNum: note.updateSequenceNum,
        updated: note.updated
      })
    }

    const newNotes = isNew
      ? notes
      : notes.map((localNote) => {
        if (localNote.guid === note.guid) {
          localNote.updateSequenceNum = note.updateSequenceNum
          localNote.updated = note.updated
        }
        return localNote
      })
    fs.writeFileSync(`${cwd}/.evernode/.notes`, JSON.stringify(newNotes ?? []))
    fs.writeFileSync(`${cwd}/${note.title ?? `untitled-${Date.now()}`}.md`, toMarkdown(note.content ?? ''))
  }
}

export const getNote = (title: string) => {
  const notes = getNotes()

  if (notes) {
    return notes.find((note) => note.title === title.replace('.md', ''))
  }
  
  return undefined
}

export const getNoteContent = (note: Note) => {
  const cwd = `${process.cwd()}`
  return toEnNote(fs.readFileSync(`${cwd}/${note.title}.md`, 'utf-8'))
}

export const getNoteUpdateTime = (note: Note) => {
  const cwd = `${process.cwd()}`
  const stats = fs.statSync(`${cwd}/${note.title}.md`)
  return stats.mtimeMs
}
