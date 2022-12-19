import { Schema, model } from 'mongoose'
// 驗證套件
import validator from 'validator'

// 建立資料庫欄位設定
const userSchema = new Schema({
  // 欄位名稱
  // 帳號
  account: {
    // 資料型態 String:指定資料型態為文字
    type: String,
    // 必填欄位（放陣列）、錯誤訊息
    required: [true, '缺少帳號'],
    // 文字長度限制
    maxlength: [20, '帳號必須是 4 ~ 20 個字'],
    minlength: [4, '帳號必須是 4 ~ 20 個字'],
    // unique => 唯一性驗證：這個欄位的資料只能出現一次
    // 如：使用者輸入相同的資料（帳號或電子郵件等）
    unique: true,
    // match  => 放正則表達式驗證 =>定義資料庫欄位有哪些內容
    match: [/^[a-zA-Z0-9]+$/, '帳號只能包含英數字'],
    // 自動去除前後空白
    trim: true
  },
  // 信箱
  email: {
    type: String,
    required: [true, '缺少信箱'],
    // unique: true => 每個信箱只能註冊一次
    unique: true,
    // 自訂驗證
    // **要先安裝 npm i validator
    validate: {
      // 驗證 function
      validator (value) {
        // 上面的 validator 是這個物件的 key
        // 下面的 validator 是 import 進來的套件
        return validator.isEmail(value)
      },
      // 錯誤訊息
      message: '信箱格式錯誤'
    }
  }
}, { versionKey: false })

// 把上面定義好的東西轉成欄位可以用的 model
// users 的這個 collection 要使用上面定義的欄位設定(userSchema) 再用 model 語法將它匯出
// model('collection 名稱（資料表）', shcema)
export default model('users', userSchema)
