import React, { useState } from 'react';
import Papa from 'papaparse';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);

  const allParsedData = [];

  let filesProcessed = 0;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      allParsedData.push(...parsed.data);
      filesProcessed++;

      if (filesProcessed === files.length) {
        // 全部文件处理完成后再设置数据
        setData(allParsedData);
      }
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

  const totalBookingAmount = filteredData.reduce((sum, row) => {
    const amount = parseFloat(row['预订额']?.replace(/[^\d.]/g, '') || 0);
    return sum + amount;
  }, 0);

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

export default App;
