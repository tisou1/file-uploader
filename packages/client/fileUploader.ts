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

  #listenToEvents =  () => {
    const dropAreaDOM = this.element.querySelector('.drop-area')

    //点击上传
    dropAreaDOM?.addEventListener('click', async () => {
      /**
       * multiple: boolean  默认false, 表示只能选择一个文件
       * excludeAcceptAllOption 布尔值，默认值是 false ，表示是否排除下面 types 中的所有的accept文件类型。
       * types
       *  可选择的文件类型数组，每个数组项也是个对象，支持下面两个参数：
            description：表示文件或者文件夹的描述，字符串，可选。
            accept：接受的文件类型，对象，然后对象的键是文件的MIME匹配，值是数组，表示支持的文件后缀。具体可以下面的示意。
       */
      const files = await window.showOpenFilePicker()
      for(const fileHandle of files) {
        //获取文件内容
        const fileData = await fileHandle.getFile() ////File类型

        this.#upload(fileData)

        // //读取文件数据
        // const buffer = await fileData.arrayBuffer()
        // //转成Blob url地址
        // let src = URL.createObjectURL(new Blob([buffer]))
      }
    })

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
      //已上传文件大小 和 总计大小
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