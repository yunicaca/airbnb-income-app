// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ✅ 这是你从 Firebase 控制台复制的配置
const firebaseConfig = {
  apiKey: "AIzaSyAlRy54-3nZLOGs6jd65facYFrcZVv3jDw",
  authDomain: "airbnb-income-app.firebaseapp.com",
  projectId: "airbnb-income-app",
  storageBucket: "airbnb-income-app.firebasestorage.app",
  messagingSenderId: "1012423155022",
  appId: "1:1012423155022:web:6311ab8b0e180930d8121f"
};

// ✅ 初始化 Firebase
const app = initializeApp(firebaseConfig);

// ✅ 导出 auth 模块，用于登录功能
export const auth = getAuth(app);
