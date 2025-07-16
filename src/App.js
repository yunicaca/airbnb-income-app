import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// 数据分析组件
function DataAnalysis() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const content = event.target.result;
        // 简单的CSV解析（你可以后续升级为使用papaparse）
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        const rows = lines.slice(1).map(line => {
          const values = line.split(',');
          const obj = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
          });
          return obj;
        });
        setData(rows);
        setFilteredData(rows);
      };
      reader.readAsText(file);
    }
  };

  const handleFilter = () => {
    let filtered = data;
    
    if (dateFilter) {
      filtered = filtered.filter(item => 
        item.date && item.date.includes(dateFilter)
      );
    }
    
    if (keywordFilter) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value.toString().toLowerCase().includes(keywordFilter.toLowerCase())
        )
      );
    }
    
    setFilteredData(filtered);
  };

  return (
    <div className="page">
      <h1>Airbnb 收入数据分析</h1>
      
      <div className="upload-section">
        <h3>上传数据文件</h3>
        <input 
          type="file" 
          accept=".csv,.txt"
          onChange={handleUpload}
          className="file-input"
        />
      </div>

      <div className="filter-section">
        <h3>数据筛选</h3>
        <div className="filters">
          <input
            type="text"
            placeholder="日期筛选 (例如: 2024-01)"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="关键词搜索"
            value={keywordFilter}
            onChange={(e) => setKeywordFilter(e.target.value)}
            className="filter-input"
          />
          <button onClick={handleFilter} className="filter-button">
            应用筛选
          </button>
        </div>
      </div>

      <div className="results-section">
        <h3>数据预览 ({filteredData.length} 条记录)</h3>
        {filteredData.length > 0 ? (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  {Object.keys(filteredData[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    {Object.values(item).map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 10 && (
              <p className="showing-info">显示前10条记录，共{filteredData.length}条</p>
            )}
          </div>
        ) : (
          <p className="no-data">请上传CSV文件开始分析</p>
        )}
      </div>
    </div>
  );
}

// 首页组件
function Home() {
  return (
    <div className="page">
      <h1>欢迎使用 Airbnb 收入分析工具</h1>
      <div className="home-content">
        <div className="feature-card">
          <h3>📊 数据分析</h3>
          <p>上传你的Airbnb收入数据，进行深入分析</p>
          <Link to="/analysis" className="card-link">开始分析</Link>
        </div>
        
        <div className="feature-card">
          <h3>💰 收入统计</h3>
          <p>查看详细的收入统计和趋势</p>
          <Link to="/reports" className="card-link">查看报告</Link>
        </div>
      </div>
    </div>
  );
}

// 报告页面组件
function Reports() {
  return (
    <div className="page">
      <h1>收入报告</h1>
      <div className="report-content">
        <div className="report-card">
          <h3>本月收入概览</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">总收入</span>
              <span className="stat-value">¥0</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">订单数</span>
              <span className="stat-value">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">平均每单</span>
              <span className="stat-value">¥0</span>
            </div>
          </div>
        </div>
        
        <div className="report-card">
          <h3>使用说明</h3>
          <ol>
            <li>前往"数据分析"页面上传你的Airbnb数据文件</li>
            <li>数据上传后，这里会显示详细的统计信息</li>
            <li>支持CSV格式的数据文件</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// 主应用组件
function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">🏠 Airbnb 分析工具</Link>
          </div>
          <div className="nav-links">
            <Link to="/">首页</Link>
            <Link to="/analysis">数据分析</Link>
            <Link to="/reports">收入报告</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analysis" element={<DataAnalysis />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2024 Airbnb 收入分析工具</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;