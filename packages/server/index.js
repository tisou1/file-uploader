const path = require('path')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const config = require('dotenv').config()
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000
const directoryPath = './uploads'

// 如果uploads目录不存在,就创建
if(!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath)
} else {
  console.log('目录已存在')
}

const uploadsPath = path.resolve(__dirname, directoryPath)

//进行文件存贮
const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, uploadsPath)
  },
  filename: function(req, file, callback) {
    const filename = req.headers['x-file-name']
    callback(null, `${Date.now()}-${decodeURIComponent(filename)}`)
    return
  }
})


const upload = multer({storage})

app.use(cors())

app.post('/upload', upload.single('file'), (req,res) => {
  console.log('req', req.file)
  //相应值
  res.json({url: `http://localhost:${PORT}/uploads/${req.file.filename}`})
})

//上传成功后访问这个路径访问静态资源,也就是刚才上传的文件
app.use('/uploads', express.static(uploadsPath))

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})