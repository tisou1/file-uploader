import { FileUploader, TASK_STATUS } from './fileUploader'
import type { Task } from './fileUploader'
const taskTemplate = document.querySelector('#template-task') as any;

new FileUploader({
  element: document.querySelector('.dnd-file-uploader')!,
  uploadUrl: 'http://localhost:3334/upload',
  taskRenderer: function(task: Task) {

    const taskDOM = taskTemplate.content.firstElementChild.cloneNode(true);
    const nameDOM = taskDOM.querySelector('.task-name')
    nameDOM.textContent = task.name
    const progressDOM = taskDOM.querySelector('.task-progress')
    const progress = `${task.progress}%`
    progressDOM.textContent = progress
    if (task.status === TASK_STATUS.PROCESSING) {
      taskDOM.style.background = `linear-gradient(to right, #bae7ff ${progress}, #fafafa ${progress}, #fafafa 100%)`
    } else if (task.status === TASK_STATUS.SUCCESS) {
      taskDOM.style.background = '#d9f7be';
      nameDOM.href = task.url;
    } else if (task.status === TASK_STATUS.ERROR) {
      taskDOM.style.background = '#ffccc7';
    }
    return taskDOM;
  }
})

const input = document.querySelector('#input')!
input.addEventListener('change', (e) => {
  console.log(e.target.files[0])
  const file = e.target.files[0];

  const chunkSize = 1024 * 1024; // 1MB
  const size = file.size
  let start = 0;
  let end = Math.min(start, size)
  let count = 0
  while(start < size) {
    const chunk = file.slice(start, end)
    const formdata = new FormData()
    formdata.append('file', chunk)
    formdata.append('hash', `${count}`)
    formdata.append('filename', `文件-`)

    const headers = new Headers();
    headers.append('x-file-name', encodeURIComponent(`文件切片${count}`));

    fetch('http://localhost:3334/upload2',{
      method: 'post',
      body: formdata,
      headers: headers
    })
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })
    .catch(e => {
      console.log(e)
    })  

    start = end
    end = Math.min(start + chunkSize, size)
    count++
  }
})

