// src/Login.js
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = getAuth();

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('注册成功，请点击登录');
        setIsRegister(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onLogin(); // 登录成功后切换状态
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{isRegister ? '注册新账号' : '登录'}</h2>
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: '10px' }}
      /><br />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br /><br />
      <button onClick={handleSubmit}>{isRegister ? '注册' : '登录'}</button>
      <br /><br />
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? '已有账号？点击登录' : '没有账号？点击注册'}
      </button>
    </div>
  );
}

export default Login;
