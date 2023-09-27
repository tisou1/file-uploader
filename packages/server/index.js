const path = require('path')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const config = require('dotenv').config()
const fs = require('fs')
const fsp = require('fs/promises')
const app = express()
const formidable = require('formidable').default
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 3000
const directoryPath = './uploads'

// 如果uploads目录不存在,就创建
if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath)
} else {
  console.log('目录已存在')
}

const uploadsPath = path.resolve(__dirname, directoryPath)

// //进行文件存贮
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadsPath)
  },
  filename: function (req, file, callback) {
    const filename = req.headers['x-file-name']
    callback(null, `${Date.now()}-${decodeURIComponent(filename)}`)
    return
  },
})

const upload = multer({ storage })

app.use(cors())
// 解析请求体的body
// 也可以使用bodyParser
// app.use(bodyParser.json())
// express内置了解析json的
app.use(express.json())

app.post('/upload', upload.single('file'), (req, res) => {
  const filename = req.headers['x-file-name']
  console.log('req', req.file, filename)
  //相应值
  res.json({ url: `http://localhost:${PORT}/uploads/${req.file.filename}` })
})

// app.use(express.urlencoded({ extended: true })); // 解析表单数据
// 测试大文件上传

//上传成功后访问这个路径访问静态资源,也就是刚才上传的文件
app.use('/uploads', express.static(uploadsPath))

app.get('/', (req, res) => {
  res.send(`
    <h2>With <code>"express"</code> npm package</h2>
    <form action="/api/upload" enctype="multipart/form-data" method="post">
      <div>Text field title: <input type="text" name="title" /></div>
      <div>File: <input type="file" name="someExpressFiles" multiple="multiple" /></div>
      <input type="submit" value="Upload" />
    </form>
  `)
})

app.post('/api/upload', (req, res, next) => {
  const form = formidable({})

  form.parse(req, async (err, fields, files) => {
    if (err) {
      next(err)
      return
    }
    // 同步保存chunk
    // saveFileChunkSync(fields)

    // 一步保存chunk
    // console.log(files, files)
    const savePromises = []
    for (const chunk of files.chunk) {
      const savePromise = saveFileChunkAsync(files, fields);
      savePromises.push(savePromise);
    }
    // await saveFileChunkAsync(files, fields)

    Promise.all(saveFileChunkAsync)
      .then(() => {
        res.json({ fields, files });
      }).catch((error) => {
        res.status(500).json({ error: '保存分片时出错' });
      });

    // res.json({ fields, files })
  })
})

app.post('/api/merge', async (req, res) => {
  console.log(req.body, '???')
  const fileName = req.body.fileName
  // 获取目录
  const filePath = path.resolve(directoryPath, 'chunkDir_' + fileName)

  await mergeFileChunkAsync(filePath, fileName)

  // 读取指定目录, 然后进行合并
  res.json({ code: 0 })
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

function mergeFileChunk(filePath, fileName) {
  // todo
  console.log('fileath1:', filePath)
  setTimeout(() => {
    const files = fs.readdirSync(filePath)
    console.log('files:', files)

    return
    files.sort((a, b) => a.split('-').at(-1) - b.split('-').at(-1))
    const chunkSize = 1024 * 1024 // 1MB
    // files.forEach((chunkpath, index) => {
    //   pipeStream(
    //     path.resolve(filePath, chunkpath),
    //     // 根据 size 在指定位置创建可写流
    //     fs.createWriteStream(uploadsPath + '/' + fileName, {
    //       start: index * chunkSize,
    //     })
    //   )
    // })
  })
}

// mergeFileChunk(
//   'D:/t/file-uploader/packages/server/uploads/chunkDir_jQuery权威指南',
//   'jQuery权威指南.pdf'
// )

function pipeStream(path, writeStream) {
  const readStream = fs.createReadStream(path)
  readStream.on('end', () => {
    // 删除已合并的切片文件（可选）
    fs.unlink(path, err => {
      if (err) {
        console.error('删除切片文件失败:', err)
      }
    })
  })

  readStream.pipe(writeStream)
}

function saveFileChunkSync(files, fields) {
  const [chunk] = files.chunk
  const [hash] = fields.hash
  const [fileName] = fields.fileName
  // 创建临时文件 用于保存chunk
  const chunkDir = path.resolve(directoryPath, 'chunkDir_' + fileName)
  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir)
  }
  // 将二进制写入的临时目录下
  // 异步
  // await fsp.writeFile(`${chunkDir}/${fileName}-${hash}`, await fsp.readFile(chunk.filepath))
  // 同步
  fs.writeFileSync(
    `${chunkDir}/${fileName}-${hash}`,
    fs.readFileSync(chunk.filepath)
  )
}

async function mergeFileChunkAsync(dirPath, fileName) {
  const files = await fsp.readdir(dirPath)
  console.log('files:', files, dirPath, fileName)
  files.sort((a, b) => a.split('-').at(-1) - b.split('-').at(-1))
  const chunkSize = 1024 * 1024 // 1MB
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const data = await fsp.readFile(filePath)
    await fsp.appendFile(uploadsPath + '/' + fileName, data)
    await fsp.unlink(filePath) // 删除已合并的切片
  }

  // 最后删除目录
  // fsp.rmdir(dirPath)
  // files.forEach((chunkpath, index) => {
  //   pipeStream(
  //     path.resolve(filePath, chunkpath),
  //     // 根据 size 在指定位置创建可写流
  //     fsp.createWriteStream(uploadsPath + '/' + fileName, {
  //       start: index * chunkSize,
  //     })
  //   )
  // })
}

async function saveFileChunkAsync(files, fields) {
  return new Promise(async (resolve, reject) => {
    const [chunk] = files.chunk
    const [hash] = fields.hash
    const [fileName] = fields.fileName
    // 创建临时文件 用于保存chunk
    const chunkDir = path.resolve(directoryPath, 'chunkDir_' + fileName)
    if (!(await directoryExists(chunkDir))) {
      const createDir = await fsp.mkdir(chunkDir)
      console.log('dir:', createDir)
    }

    // 异步保存
    await fsp.writeFile(
      `${chunkDir}/${fileName}-${hash}`,
      await fsp.readFile(chunk.filepath)
    ).then(res => {
      resolve()
    }).catch(err => {
      reject(err)
    })
  })
}

async function directoryExists(path) {
  try {
    const stats = await fsp.stat(path)
    return stats.isDirectory() // 如果是目录，则返回 true
  } catch (err) {
    return false // 目录不存在或发生错误
  }
}
