// src/App.js

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Papa from 'papaparse';

function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  // 🔐 检查用户是否登录
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 🚪 登出函数
  const handleLogout = () => {
    signOut(auth);
  };

  // ⬇️ 如果没有登录，显示登录界面
  if (!user) return <Login />;

  // 📤 上传并处理 CSV 文件（可多选）
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const allData = [];

    files.forEach((file, index) => {
      const fileMonth = file.name.match(/\d{4}-\d{2}/)?.[0] || '';
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        beforeFirstChunk: (chunk) => {
          const lines = chunk.split('\n');
          if (lines[0].includes('从') && lines[0].includes('的月度报告')) {
            return lines.slice(1).join('\n');
          }
          return chunk;
        },
        complete: function (results) {
          const enhanced = results.data.map(row => ({
            ...row,
            月份: row['月份'] || fileMonth
          }));
          allData.push(...enhanced);
          if (index === files.length - 1) {
            setData(allData);
            setFilteredData(allData);
          }
        }
      });
    });
  };

  const handleFilter = () => {
    const filtered = data.filter(row => {
      const matchesMonth = monthFilter ? row['月份']?.includes(monthFilter) : true;
      const matchesKeyword = keywordFilter ? row['内部名称']?.includes(keywordFilter) : true;
      return matchesMonth && matchesKeyword;
    });
    setFilteredData(filtered);
  };

  const totalBookingAmount = filteredData.reduce((sum, row) => {
    const amount = parseFloat(row['预订额']?.replace(/[^\d.]/g, '') || 0);
    return sum + amount;
  }, 0);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Airbnb 收入汇总工具（月度报告）</h2>
      <p>欢迎，{user.email}！<button onClick={handleLogout}>登出</button></p>

      <input type="file" accept=".csv" multiple onChange={handleFileUpload} />

      <div style={{ marginTop: '10px' }}>
        按月份筛选：
        <input type="month" onChange={e => setMonthFilter(e.target.value)} />
        &nbsp;&nbsp;
        按房源关键词筛选（内部名称）：
        <input type="text" placeholder="例如: 14" onChange={e => setKeywordFilter(e.target.value)} />
        &nbsp;
        <button onClick={handleFilter}>筛选</button>
      </div>

      <div style={{ marginTop: '10px' }}>筛选后预订额总价：¥{totalBookingAmount.toLocaleString()}</div>

      <table border="1" cellPadding="5" style={{ marginTop: '10px', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>房源名称</th>
            <th>内部名称</th>
            <th>货币</th>
            <th>预订额</th>
            <th>获订晚数</th>
            <th>日均价</th>
            <th>月份</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((ro
