import React, { useState, useEffect } from "react";
import Papa from "papaparse";

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [keyword, setKeyword] = useState("");

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const allParsedData = [];
    let filesProcessed = 0;

    files.forEach((file) => {
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
          setData(allParsedData);
        }
      };
      reader.readAsText(file);
    });
  };

  useEffect(() => {
    let filtered = data;

    if (selectedMonth) {
      filtered = filtered.filter((row) =>
        row["月份"]?.startsWith(selectedMonth)
      );
    }

    if (keyword) {
      filtered = filtered.filter((row) =>
        row["内部名称"]?.includes(keyword)
      );
    }

    setFilteredData(filtered);
  }, [selectedMonth, keyword, data]);

  const getTotalAmount = () => {
    return filteredData.reduce((sum, row) => {
      const amount = parseFloat(row["预订额"]);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Airbnb 收入汇总工具（月度报告）</h2>
      <div style={{ marginBottom: 10 }}>
        <input type="file" multiple onChange={handleFileUpload} />
      </div>
      <div style={{ marginBottom: 10 }}>
        按月份筛选：
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        &nbsp;&nbsp;按房源关键词筛选（内部名称）：
        <input
          type="text"
          placeholder="例如: 14"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 10 }}>筛选后预订额总价：￥{getTotalAmount().toLocaleString()}</div>
      <table border="1" cellPadding="5">
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
          {filteredData.map((row, index) => (
            <tr key={index}>
              <td>{row["房源名称"]}</td>
              <td>{row["内部名称"]}</td>
              <td>{row["货币"]}</td>
              <td>{row["预订额"]}</td>
              <td>{row["获订晚数"]}</td>
              <td>{row["日均价"]}</td>
              <td>{row["月份"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
