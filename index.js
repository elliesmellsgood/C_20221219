//  index.js 寫 api 的主體

import 'dotenv/config'
import mongoose from 'mongoose'
import express from 'express'
import users from './users.js'

// callback function 連線資料庫
mongoose.connect(process.env.DB_URL, () => {
  console.log('資料庫連線成功')
})

// 建立 express 伺服器 ->伺服器套件
const app = express()

// 設定 express 將傳入的 body 讀取並解析為 json ，再到下面看各種請求的方法
// **要注意 express 的順序！！！
// **若沒加下面這行 express 無法收到 post 或 patch 帶進來的 body 的內容
app.use(express.json())

// 處理 express.json 的錯誤，沒出錯會直接往下走處理請求
// 這個 function 會去處理以上程式碼有發生的錯誤
// 1. 用 _ 代表發生的錯誤，並取代 error 忽略 error 這個參數，如果寫 error  就是定義它，就必須 console.log
// 2. req 收到請求 3. res 回應
// 4. next 代表進到下一步，在這邊用不到
app.use((_, req, res, next) => {
  res.status(400).json({ success: false, message: 'JSON 格式錯誤' })
})

// --- 下列寫各種請求的回應 (需使用 promise 語法，因為是要用 model 語法將它匯出 )---

// app.post()新增(如: 會員註冊/登入)
// request 要傳進來的資料 response 要送出去的回應
// '/' 代表根目錄
app.post('/', async (req, res) => {
  try {
    // 建立好的資料存進 result
    // 建立後 mongoose 會自動產生 id 與 versionKey （"＿v" )
    // versionKey 是紀錄資料修改了幾次，若不要紀錄可以在 uesrs.js 加上 { versionKey: false }
    const result = await users.create({
      // 欄位名稱：值
      account: req.body.account,
      email: req.body.email
    })
    // 設定狀態碼(200) 與回傳的資料
    // 預設狀態碼就是200，所以也可以省略
    // 若單純傳文字可以寫 res.send('要傳送的文字')
    res.status(200).json({ success: true, massage: '', result })
  } catch (error) {
    // 處理驗證錯誤 ＊＊不會驗證重複的錯誤＊＊

    // 如果錯誤的名字是 ValidationError
    if (error.name === 'ValidationError') {
      // 取出第一個[0]驗證失敗的欄位名稱
      const key = Object.keys(error.errors)[0]
      // 用取出的名稱抓出錯誤訊息
      const message = error.errors[key].message
      // 回傳錯誤
      res.status(400).json({ success: false, message })
      // 處理重複錯誤
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      // res.status(400).json({ success: false, message: '帳號或信箱已被使用' })
      // 取出驗證失敗的欄位名稱
      const key = Object.keys(error.keyPattern)[0]
      res.status(400).json({ success: false, message: `${key === 'account' ? '帳號' : '信箱'}已被使用` })
    } else {
      // 可能會有預想不到的錯誤，因此建議加上狀態碼 500
      res.status(500).json({ sucess: false, message: '未知錯誤' })
    }
  }
})

// app.get() 請求資料(如: 一般網站瀏覽、找商品)
// 查全部
app.get('/', async (req, res) => {
  try {
    // .find() 裡面放查詢條件，不放就是查全部
    const result = await users.find()
    res.status(200).json({ success: true, message: '', result })
  } catch (error) {
    res.status(500).json({ success: false, message: '未知錯誤' })
  }
})

// 查指定條件
// '/:id' 把接在斜線後面的資料皆會命名為 id
app.get('/:id', async (req, res) => {
  try {
    // const result = await users.find({ _id: '' })
    // req.params 網址用的路由參數
    // req.params.id 抓參數的 id
    const result = await users.findById(req.params.id)
    // 如果符合
    if (result) {
      res.status(200).json({ success: true, message: '', result })
    } else {
      res.status(404).json({ success: false, message: '找不到' })
    }
  } catch (error) {
    // id 的查詢若格式錯誤會觸發 CastError
    if (error.name === 'CastError') {
      res.status(400).json({ success: false, message: 'ID 格式不正確' })
    }
    res.status(500).json({ success: false, message: '未知錯誤' })
  }
})

// app.delete() 指定刪除
app.delete('/:id', async (req, res) => {
  try {
    // 只刪除一個
    // const result = await users.deleteOne({ _id: req.params.id })
    // findByIdAndDelete() 觸發刪除語法
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

// patch 部分資料更新
// 編輯使用者資料/帳密
// 補充：put 是整組修改（較少用）
app.patch('/:id', async (req, res) => {
  try {
    // runValidators:true 設定執行驗證
    // users.findByIdAndUpdate (參數的 id, 要更新的資料, 設定）
    // 因為不確定使用者要更新什麼欄位 所以要更新的資料直接放 req.body
    // **一定要加 new:true 更新資料，否則會回給你更新前的資料
    // **runValidators: true 執行驗證
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
      // Object.keys 抓出有錯誤的 keys
      console.log(error)
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

// 任意請求方式(get/post/patch...)、＊代表任意網址，
// 若以上皆非（如：使用者亂打網址）就可以看到哪些請求不可行．就可以測試，所以必須放在請求回應的下面！
// 因此我們必須將這個訊息擋下來，回傳’404 找不到'
app.all('*', (req, res) => {
  res.status(404).json({ success: false, message: '找不到' })
})

// --- 以上寫各種請求的回應 ---

// 監聽 PORT 4000 的請求
app.listen(process.env.PORT || 4000, () => {
  console.log('伺服器啟動')
})
