import React, { useState } from "react";
import Papa from "papaparse";

function App() {
  const [rawData, setRawData] = useState([]);
  const [filteredMonth, setFilteredMonth] = useState("");
  const [keyword, setKeyword] = useState("");

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length === 0) return;

    Papa.parse(files[0], {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cleaned = results.data.filter((row) => {
          const name = row["房源名称"]?.trim();
          const internal = row["内部名称"]?.trim();
          const currency = row["货币"]?.trim();
          const amount = row["预订额"]?.trim();
          const nights = row["获订晚数"]?.trim();
          return name && internal && currency && amount && nights;
        });

        console.log("✅ 清洗后的数据:", cleaned);
        setRawData(cleaned);
      },
    });
  };

  const filteredData = rawData.filter((item) => {
    const matchesMonth = filteredMonth
      ? item["月份"]?.startsWith(filteredMonth)
      : true;
    const matchesKeyword = keyword
      ? item["内部名称"]?.includes(keyword)
      : true;
    return matchesMonth && matchesKeyword;
  });

  const totalAmount = filteredData.reduce((sum, item) => {
    const amount = parseFloat(item["预订额"].replace(/[^\d.]/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div style={{ padding: 20 }}>
      <h2>Airbnb 收入汇总工具（月度报告）</h2>

      <input type="file" accept=".csv" onChange={handleFileUpload} multiple />

      <div style={{ marginTop: 20 }}>
        <label>
          按月份筛选：
          <input
            type="month"
            value={filteredMonth}
            onChange={(e) => setFilteredMonth(e.target.value)}
          />
        </label>

        <label style={{ marginLeft: 20 }}>
          按房源关键词筛选（内部名称）：
          <input
            type="text"
            placeholder="例如: 14"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
      </div>

      <p style={{ marginTop: 10 }}>筛选后预订额总价：¥{totalAmount.toLocaleString()}</p>

      <table border="1" cellPadding="8" style={{ marginTop: 10, borderCollapse: "collapse" }}>
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
