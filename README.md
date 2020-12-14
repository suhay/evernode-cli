# Evernode CLI

The CLI you never asked for, nor probably need, for your Evernote Netbooks. Unless, like me, you require a distraction free environment to do any kind of planning or writing, in which case, an old Chromebook running Arch Linux. If that is you, then this is perfect.

## Setup

First you need a production API Key / Secret pair, or a production Access Token. Logging in is on you, we want no part of it. You'll need to make one with `Full Access`.

API KEY: https://dev.evernote.com/doc/  
Token: https://dev.evernote.com/get-token/  
Evernote FAQ: https://dev.evernote.com/support/faq.php

## Go

```bash
$ yarn add @suhay/evernode-cli
$ mkdir ~/notebook
$ cd ~/notebook

$ evernode          # asks for and saves your API keys
$ evernode --init   # initializes the current directory as your notebook root
```

| Flag      | Description |
| :-------- | :---------- |
| `-l, --list`  | If within the notebook `root`, it will list all locally cached notebook names. If within a `notebook`, it will list all locally cached note names. |
| `-o, --open <name>` | If within the notebook `root`, it will open the named notebook locally and create a directory for it. If within a `notebook`, it will open the named note and copy the content into the markdown file. |
| `-n, --new <name>` | If within the notebook `root`, it will create a notebook, both remotely and locally, with the given name. If within a `notebook`, it will create a note, both locally and remotely, with the given name. |
| `-s, --sync [note]` | If within the notebook `root`, it will refresh the local cache of notebook names. If within a `notebook`, it will refresh the local cache of note names. If a note's name is provided, it will sync the file contents either from Evernote or locally depending on which version is more recent. |