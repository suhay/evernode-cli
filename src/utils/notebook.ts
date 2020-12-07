import Evernote from 'evernote'
import fs from 'fs'

export interface Notebook {
  name: string
  guid: string
}

export const isRoot = () => {
  const cwd = `${process.cwd()}`
  return fs.existsSync(`${cwd}/.evernode/.root`)
}

export const isNotebook = () => {
  const cwd = `${process.cwd()}`
  return fs.existsSync(`${cwd}/.evernode/.guid`)
}

export const saveNotebooks = (notebooks: Evernote.Types.Notebook[]) => {
  const cwd = `${process.cwd()}`

  fs.writeFileSync(`${cwd}/.evernode/.root`, 
    JSON.stringify(
      notebooks.map((notebook) => ({
        name: notebook.name,
        guid: notebook.guid
      })
    )
  ))      
}

export const getNotebookRoot = (): Notebook[] | undefined => {
  const cwd = `${process.cwd()}`

  if (isRoot()) {
    return JSON.parse(fs.readFileSync(`${cwd}/.evernode/.root`, 'utf-8'))
  } else if (fs.existsSync(`${cwd}/../.evernode/.root`)) {
    return JSON.parse(fs.readFileSync(`${cwd}/../.evernode/.root`, 'utf-8'))
  }

  return undefined
}

export const setNotebookRoot = () => {
  const cwd = `${process.cwd()}`

  if (!fs.existsSync(`${cwd}/.evernode`)) {
    fs.mkdirSync(`${cwd}/.evernode`, {
      mode: 0o700
    })
    fs.writeFileSync(`${cwd}/.evernode/.root`, '')
  }
}

export const getNotebookGuid = () => {
  const cwd = `${process.cwd()}`

  if (fs.existsSync(`${cwd}/.evernode/.guid`)) {
    return fs.readFileSync(`${cwd}/.evernode/.guid`, 'utf-8')
  }
  
  return undefined
}

export const setNotebookGuid = (guid: string, name: string) => {
  const cwd = `${process.cwd()}`

  if (!fs.existsSync(`${cwd}/${name}`)) {
    fs.mkdirSync(`${cwd}/${name}`, {
      mode: 0o700
    })
    fs.mkdirSync(`${cwd}/${name}/.evernode`, {
      mode: 0o700
    })
    fs.writeFileSync(`${cwd}/${name}/.evernode/.guid`, guid)
  }
}
