import React, { useState } from "react";
import Papa from "papaparse";

function App() {
  const [data, setData] = useState([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");

  const handleFileUpload = (event) => {
    const files = event.target.files;
    let allData = [];

    Array.from(files).forEach((file) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          allData = [...allData, ...results.data];
          setData((prev) => [...prev, ...results.data]);
        },
      });
    });
  };

  const getFilteredData = () => {
    return data.filter((row) => {
      const monthMatch = monthFilter ? row["月份"]?.includes(monthFilter) : true;
      const keywordMatch = keywordFilter ? row["内部名称"]?.includes(keywordFilter) : true;
      return monthMatch && keywordMatch;
    });
  };

  const getTotalByMonth = () => {
    const filtered = getFilteredData();
    return filtered.reduce((total, row) => {
      const amount = parseFloat(row["预订额"] || 0);
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const filteredData = getFilteredData();
  const totalRevenue = getTotalByMonth();

  return (
    <div style={{ padding: "20px" }}>
      <h2>Airbnb 收入汇总工具（月度报告）</h2>
      <input type="file" multiple accept=".csv" onChange={handleFileUpload} />
      <div style={{ marginTop: 10 }}>
        <label>
          按月份筛选：
          <input
            type="text"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            placeholder="例如: 2025-06"
          />
        </label>
        <label style={{ marginLeft: 20 }}>
          按房源关键词筛选（内部名称）：
          <input
            type="text"
            value={keywordFilter}
            onChange={(e) => setKeywordFilter(e.target.value)}
            placeholder="例如: 14"
          />
        </label>
      </div>
      <div style={{ marginTop: 20 }}>
        <strong>筛选后预订额总价：</strong> ¥{totalRevenue.toLocaleString()}
      </div>
      <table
        style={{
          marginTop: 20,
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>房源名称</th>
            <th style={thStyle}>内部名称</th>
            <th style={thStyle}>货币</th>
            <th style={thStyle}>预订额</th>
            <th style={thStyle}>获订晚数</th>
            <th style={thStyle}>日均价</th>
            <th style={thStyle}>月份</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr key={index}>
              <td style={tdStyle}>{row["房源名称"]}</td>
              <td style={tdStyle}>{row["内部名称"]}</td>
              <td style={tdStyle}>{row["货币"]}</td>
              <td style={tdStyle}>{row["预订额"]}</td>
              <td style={tdStyle}>{row["获订晚数"]}</td>
              <td style={tdStyle}>{row["日均价"]}</td>
              <td style={tdStyle}>{row["月份"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  backgroundColor: "#f4f4f4",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
};

export default App;
