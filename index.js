import 'dotenv/config'
import mongoose from 'mongoose'
import express from 'express'
import users from './users.js'

// 連線資料庫
mongoose.connect(process.env.DB_URL, () => {
  console.log('資料庫連線成功')
})

// 建立 express 伺服器
const app = express()

// 設定 express 將傳入的 body 解析為 json
app.use(express.json())

// 處理 express.json 的錯誤
// 用 _ 取代 error 忽略 error 這個參數
app.use((_, req, res, next) => {
  res.status(400).json({ success: false, message: 'JSON 格式錯誤' })
})

// 新增(如: 登入)
app.post('/', async (req, res) => {
  try {
    const result = await users.create({
      // req 進來的 res 出去的
      account: req.body.account,
      email: req.body.email
    })
    // 設定狀態碼(200) 與回傳的資料
    res.status(200).json({ success: true, massage: '', result })
  } catch (error) {
    // 處理驗證錯誤
    if (error.name === 'ValidationError') {
      // 取出第一個驗證失敗的欄位名稱
      const key = Object.keys(error.errors)[0]
      // 用取出的名稱取錯誤訊息
      const message = error.errors[key].message
      res.status(400).json({ success: false, message })
      // 處理重複錯誤
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      // res.status(400).json({ success: false, message: '帳號或信箱已被使用' })
      // 取出驗證失敗的欄位名稱
      const key = Object.keys(error.keyPattern)[0]
      res.status(400).json({ success: false, message: `${key === 'account' ? '帳號' : '信箱'}已被使用` })
    } else {
      res.status(500).json({ sucess: false, message: '未知錯誤' })
    }
  }
})

// 查資料(如: 一般網站瀏覽、找商品)
app.get('/', async (req, res) => {
  try {
    // .find() 裡面放查詢條件，不放就是查全部
    const result = await users.find()
    res.status(200).json({ success: true, message: '', result })
  } catch (error) {
    res.status(500).json({ success: false, message: '未知錯誤' })
  }
})

app.get('/:id', async (req, res) => {
  try {
    // const result = await users.find({ _id: '' })
    const result = await users.findById(req.params.id)
    if (result) {
      res.status(200).json({ success: true, message: '', result })
    } else {
      res.status(404).json({ success: false, message: '找不到' })
    }
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, message: 'ID 格式不正確' })
    }
    res.status(500).json({ success: false, message: '未知錯誤' })
  }
})

app.delete('/:id', async (req, res) => {
  try {
    // const result = await users.deleteOne({ _id: req.params.id })
    const result = await users.findByIdAndDelete(req.params.id)
    if (result) {
      res.status(200).json({ success: true, message: '' })
    } else {
      res.status(404).json({ success: false, message: '找不到' })
    }
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, message: 'ID 格式不正確' })
    } else {
      res.status(500).json({ success: false, message: '未知錯誤' })
    }
  }
})

// 修改(部分)
// 編輯使用者資料/帳密
app.patch('/:id', async (req, res) => {
  try {
    // new:true 設定回完更新後的資料
    // runValidators:true 設定執行驗證
    const result = await users.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (result) {
      res.status(200).json({ success: true, message: '', result })
    } else {
      res.status(404).json({ success: false, message: '找不到' })
    }
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, message: 'ID 格式不正確' })
    } else if (error.name === 'ValidationError') {
      // 取出第一個驗證失敗的欄位名稱
      const key = Object.keys(error.errors)[0]
      // 用取出的名稱取錯誤訊息
      const message = error.errors[key].message
      res.status(400).json({ success: false, message })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      // res.status(400).json({ success: false, message: '帳號或信箱已被使用' })
      // 取出驗證失敗的欄位名稱
      const key = Object.keys(error.keyPattern)[0]
      res.status(409).json({ success: false, message: `${key === 'account' ? '帳號' : '信箱'}已被使用` })
    } else {
      res.status(500).json({ success: false, message: '未知錯誤' })
    }
  }
})

// 任意請求方式，若以上皆非
app.all('*', (req, res) => {
  res.status(404).json({ success: false, message: '找不到' })
})

// 監聽 PORT 4000 的請求
app.listen(process.env.PORT || 4000, () => {
  console.log('伺服器啟動')
})
