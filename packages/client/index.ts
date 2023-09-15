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
  const fileName = file.name
  console.log(file)
  const chunkSize = 1024 * 1024; // 1MB
  const size = file.size
  console.log(size)
  let start = 0;
  let end = Math.min(chunkSize, size)
  let count = 0
  while(start < size) {
    const chunk = file.slice(start, end)
    console.log(chunk)
    const formdata = new FormData()
    formdata.append('chunk', chunk)
    formdata.append('hash', `${count}`)
    formdata.append('fileName', fileName)
    fetch('http://localhost:3334/api/upload',{
      method: 'post',
      body: formdata,
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

  // merge
  fetch('http://localhost:3334/api/merge', {
    method: 'post',
    body: JSON.stringify({merge: true, fileName: fileName}),
    headers: {
      'Content-Type': 'application/json' // 设置请求的内容类型为JSON
    },
  }).then(res => res.json()).then(data => {
    console.log(data)
  })
})

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }
  return result;
}

// 生成一个长度为 10 的随机字符串

