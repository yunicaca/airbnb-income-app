import React, { useState } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const content = event.target.result;
          // 简单的CSV解析
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length === 0) return;
          
          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] ? values[index].trim() : '';
            });
            return obj;
          });
          
          setData(rows);
          setFilteredData(rows);
          alert(`成功上传 ${rows.length} 条数据！`);
        } catch (error) {
          alert('文件解析失败，请检查CSV格式');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFilter = () => {
    let filtered = data;
    
    if (dateFilter) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value.toString().includes(dateFilter)
        )
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

  const clearFilters = () => {
    setDateFilter('');
    setKeywordFilter('');
    setFilteredData(data);
  };

  const calculateStats = () => {
    if (!data || data.length === 0) {
      return { totalIncome: 0, orderCount: 0, avgIncome: 0 };
    }
    
    // 尝试找到收入相关的列
    const incomeFields = ['income', '收入', '金额', 'amount', 'price', '价格'];
    let totalIncome = 0;
    let validIncomeCount = 0;
    
    data.forEach(item => {
      for (let field of incomeFields) {
        const value = item[field];
        if (value) {
          const numValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
          if (!isNaN(numValue)) {
            totalIncome += numValue;
            validIncomeCount++;
            break;
          }
        }
      }
    });
    
    const orderCount = data.length;
    const avgIncome = validIncomeCount > 0 ? totalIncome / validIncomeCount : 0;
    
    return { totalIncome, orderCount, avgIncome };
  };

  const stats = calculateStats();

  return (
    <div className="App">
      {/* 头部 */}
      <header className="header">
        <h1>🏠 Airbnb 收入分析工具</h1>
        <p>简单易用的数据分析平台</p>
      </header>

      {/* 主内容 */}
      <main className="main-content">
        
        {/* 统计卡片 */}
        <div className="stats-section">
          <div className="stat-card">
            <h3>总收入</h3>
            <div className="stat-value">¥{stats.totalIncome.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <h3>数据条数</h3>
            <div className="stat-value">{stats.orderCount}</div>
          </div>
          <div className="stat-card">
            <h3>平均值</h3>
            <div className="stat-value">¥{stats.avgIncome.toFixed(2)}</div>
          </div>
        </div>

        {/* 文件上传区域 */}
        <div className="upload-section">
          <h2>📁 上传数据文件</h2>
          <div className="upload-area">
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleUpload}
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="upload-label">
              <div className="upload-icon">📄</div>
              <div>点击选择CSV文件或拖拽到此处</div>
              <div className="upload-hint">支持 .csv 和 .txt 格式</div>
            </label>
          </div>
        </div>

        {/* 筛选区域 */}
        {data.length > 0 && (
          <div className="filter-section">
            <h2>🔍 数据筛选</h2>
            <div className="filter-controls">
              <input
                type="text"
                placeholder="按内容筛选..."
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                className="filter-input"
              />
              <input
                type="text"
                placeholder="按日期筛选 (如: 2024-01)..."
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-input"
              />
              <button onClick={handleFilter} className="btn btn-primary">
                应用筛选
              </button>
              <button onClick={clearFilters} className="btn btn-secondary">
                清除筛选
              </button>
            </div>
          </div>
        )}

        {/* 数据表格 */}
        {filteredData.length > 0 && (
          <div className="table-section">
            <h2>📊 数据预览</h2>
            <div className="table-info">
              <span>显示 {Math.min(10, filteredData.length)} / {filteredData.length} 条记录</span>
            </div>
            <div className="table-container">
              <table className="data-table">
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
                        <td key={i} title={value}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        {data.length === 0 && (
          <div className="help-section">
            <h2>📋 使用说明</h2>
            <div className="help-content">
              <div className="help-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>准备数据文件</h3>
                  <p>准备包含收入数据的CSV文件，确保包含日期、金额等字段</p>
                </div>
              </div>
              <div className="help-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>上传文件</h3>
                  <p>点击上方的文件上传区域，选择你的CSV文件</p>
                </div>
              </div>
              <div className="help-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>查看分析</h3>
                  <p>上传后即可查看收入统计和数据表格</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </main>

      {/* 页脚 */}
      <footer className="footer">
        <p>&copy; 2024 Airbnb 收入分析工具 - 简单、快速、可靠</p>
      </footer>
    </div>
  );
}

export default App;