import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import MonthlyDetailAnalysis from './pages/MonthlyDetailAnalysis';
import Papa from 'papaparse';

function MonthlySummary() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    let allData = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const content = event.target.result;
        const lines = content.split('\n');

        let month = '';
        const monthMatch = lines[0].match(/\d{4}-\d{2}/);
        if (monthMatch) {
          month = monthMatch[0];
        }

        const csvContent = lines.slice(1).join('\n');
        Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            const enriched = results.data.map(row => ({ ...row, '月份': month }));
            allData = [...allData, ...enriched];
            filesProcessed++;

            if (filesProcessed === files.length) {
              setData(allData);
              setFilteredData(allData);
            }
          }
        });
      };
      reader.readAsText(file);
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

  const getDaysInMonth = (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const totalBookingAmount = filteredData.reduce((sum, row) => {
    const amount = parseFloat(row['预订额']?.replace(/[^\d.]/g, '') || 0);
    return sum + amount;
  }, 0);

  const totalNights = filteredData.reduce((sum, row) => {
    return sum + (parseInt(row['获订晚数']) || 0);
  }, 0);

  const uniqueListings = new Set(filteredData.map(row => row['房源名称'])).size;
  const daysInMonth = monthFilter ? getDaysInMonth(monthFilter) : 30;
  const occupancyRate = uniqueListings > 0
    ? ((totalNights / (uniqueListings * daysInMonth)) * 100).toFixed(2)
    : '0.00';

  return (
    <div style={{ padding: '20px' }}>
      <h2>Airbnb 收入汇总工具（月度报告）</h2>
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

      <div style={{ marginTop: '10px' }}>
        筛选后预订额总价：¥{totalBookingAmount.toLocaleString()}<br />
        筛选后入住率：{occupancyRate}%
      </div>

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
          {filteredData.map((row, idx) => (
            <tr key={idx}>
              <td>{row['房源名称']}</td>
              <td>{row['内部名称']}</td>
              <td>{row['货币']}</td>
              <td>{row['预订额']}</td>
              <td>{row['获订晚数']}</td>
              <td>{row['日均价']}</td>
              <td>{row['月份']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <h1>Airbnb 工具导航</h1>
        <nav>
          <Link to="/">月度汇总</Link>&nbsp;&nbsp;
          <Link to="/details">预订明细分析</Link>
        </nav>
        <hr />

        <Routes>
          <Route path="/" element={<MonthlySummary />} />
          <Route path="/details" element={<MonthlyDetailAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
