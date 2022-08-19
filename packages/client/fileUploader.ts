export const TASK_STATUS = {
  PROCESSING: 1,
  SUCCESS: 2,
  ERROR: 3
}

interface Options {
  element: HTMLElement
  uploadUrl: string
  taskRenderer: (arg: Task) => string | Node
}


export interface Task {
  id: number
  name: string
  status:number
  progress: number
  url?: string
}

export class FileUploader{

  element: HTMLElement
  uploadUrl: string
  taskRenderer: (arg: Task) => string | Node
  tasks: any[] = []

  constructor({
    element,
    uploadUrl,
    taskRenderer
  }: Options) {
    if(element instanceof HTMLElement) {
      this.element = element
    } else {
      throw new Error('element是无效的dom元素')
    }

    this.uploadUrl = uploadUrl
    this.taskRenderer = taskRenderer
    this.#init()
  }

  #init = () => {
    this.#listenToEvents()
  }

  #listenToEvents = () => {
    const dropAreaDOM = this.element.querySelector('.drop-area')
    //drop当一个元素或是选中的文字被拖拽释放到一个有效的释放目标位置时，drop 事件被抛出。
    dropAreaDOM?.addEventListener('drop', this.#handleDrop)
    //dragover 放下目标节点时
    dropAreaDOM?.addEventListener('dragover', this.#handleDragover)
  }

  #handleDrop = (e: any) => {
    //组织默认行为
    e.preventDefault()

    if(e.dataTransfer!.items) {
      //接收文件
      for(const item of e.dataTransfer.items) {
        if(item.kind === 'file') {
          const file = item.getAsFile()
          console.log("file:", file)
          this.#upload(file)
        }
      }
    } else {
      for(const file of e.dataTransfer.files) {
        console.log('file: ', file)
        this.#upload(file)
      }
    }
  }

  #handleDragover = (e: any) => {
    e.preventDefault()
  }


  #upload = (file: File) => {
    const data = new FormData()
    data.append('file', file)
    const task: Task = {
      id: this.tasks.length,
      name: file.name,
      status: TASK_STATUS.PROCESSING,
      progress: 0
    }
    this.tasks.unshift(task)

    const xhr = new XMLHttpRequest()
    xhr.open('post', this.uploadUrl)
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name))
    //上传中
    xhr.upload.addEventListener('progress', (e) => {
      const { loaded, total } = e
      const progress = Math.round(loaded / total * 100)
      task.progress = progress
      this.#updateTask(task)
    })
    //上传成功
    xhr.addEventListener('load', (e) => {
      task.status = TASK_STATUS.SUCCESS
      const res = JSON.parse(xhr.response)
      console.log('response', res)
      const {url} = res
      task.url = url
      this.#updateTask(task)
    })
    xhr.addEventListener('error', (e) => {
      task.status = TASK_STATUS.ERROR
      this.#updateTask(task)
    })

    xhr.send(data)
  }

  #updateTask(task: Task) {
    const taskList = this.element.querySelector('.task-list')
    const id = `task-${task.id}`
    let taskBox = taskList?.querySelector(`#${id}`)
    if(!taskBox) {
      taskBox = document.createElement('div')
      taskBox.id = id
      taskList?.prepend(taskBox)
    }
    taskBox.innerHTML = ''
    taskBox.append(this.taskRenderer(task))
  }
}