import React, { useState } from 'react';
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
        // 简单的CSV解析
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
    <div className="section">
      <h2>📊 数据分析</h2>
      
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

// 收入统计组件
function IncomeStats({ data }) {
  const calculateStats = () => {
    if (!data || data.length === 0) {
      return { totalIncome: 0, orderCount: 0, avgIncome: 0 };
    }
    
    const totalIncome = data.reduce((sum, item) => {
      const income = parseFloat(item.income || item.收入 || item.金额 || 0);
      return sum + (isNaN(income) ? 0 : income);
    }, 0);
    
    const orderCount = data.length;
    const avgIncome = orderCount > 0 ? totalIncome / orderCount : 0;
    
    return { totalIncome, orderCount, avgIncome };
  };

  const stats = calculateStats();

  return (
    <div className="section">
      <h2>💰 收入统计</h2>
      
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">总收入</span>
          <span className="stat-value">¥{stats.totalIncome.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">订单数</span>
          <span className="stat-value">{stats.orderCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">平均每单</span>
          <span className="stat-value">¥{stats.avgIncome.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="usage-guide">
        <h3>📋 使用说明</h3>
        <ol>
          <li>在"数据分析"部分上传你的Airbnb数据文件（CSV格式）</li>
          <li>数据上传后，这里会自动显示收入统计</li>
          <li>支持包含收入、金额等字段的CSV文件</li>
          <li>可以使用筛选功能查看特定时间段的数据</li>
        </ol>
      </div>
    </div>
  );
}

// 主应用组件
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [uploadedData, setUploadedData] = useState([]);

  const renderContent = () => {
    switch(currentView) {
      case 'analysis':
        return <DataAnalysisWithCallback onDataUpload={setUploadedData} />;
      case 'stats':
        return <IncomeStats data={uploadedData} />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand">
          🏠 Airbnb 收入分析工具
        </div>
        <div className="nav-links">
          <button 
            className={currentView === 'home' ? 'nav-button active' : 'nav-button'}
            onClick={() => setCurrentView('home')}
          >
            首页
          </button>
          <button 
            className={currentView === 'analysis' ? 'nav-button active' : 'nav-button'}
            onClick={() => setCurrentView('analysis')}
          >
            数据分析
          </button>
          <button 
            className={currentView === 'stats' ? 'nav-button active' : 'nav-button'}
            onClick={() => setCurrentView('stats')}
          >
            收入统计
          </button>
        </div>
      </nav>

      <main className="main-content">
        {renderContent()}
      </main>

      <footer className="footer">
        <p>&copy; 2024 Airbnb 收入分析工具</p>
      </footer>
    </div>
  );
}

// 带回调的数据分析组件
function DataAnalysisWithCallback({ onDataUpload }) {
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
        onDataUpload(rows); // 传递数据给父组件
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
    <div className="section">
      <h1>📊 Airbnb 数据分析</h1>
      
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
    <div className="section">
      <h1>🏠 欢迎使用 Airbnb 收入分析工具</h1>
      
      <div className="home-content">
        <div className="feature-card">
          <h3>📊 数据分析功能</h3>
          <ul>
            <li>上传CSV格式的收入数据</li>
            <li>按日期和关键词筛选数据</li>
            <li>查看数据表格预览</li>
            <li>支持大文件处理</li>
          </ul>
        </div>
        
        <div className="feature-card">
          <h3>💰 收入统计功能</h3>
          <ul>
            <li>自动计算总收入</li>
            <li>统计订单数量</li>
            <li>计算平均每单收入</li>
            <li>实时更新数据</li>
          </ul>
        </div>
        
        <div className="feature-card">
          <h3>🚀 开始使用</h3>
          <ol>
            <li>点击"数据分析"上传你的CSV文件</li>
            <li>使用筛选功能查看特定数据</li>
            <li>查看"收入统计"了解详细数据</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;