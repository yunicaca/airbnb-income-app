import { useState } from "react";
import Papa from "papaparse";

function App() {
  const [summary, setSummary] = useState([]);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    const allRows = [];

    const parseFile = (file) => {
      return new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          skipRows: 1,
          complete: (results) => {
            resolve(results.data);
          },
        });
      });
    };

    const processFiles = async () => {
      let parsedRows = [];
      for (const file of files) {
        const parsed = await parseFile(file);
        // 去掉第一行标题（比如“从2025-02-01到...”）
        const cleaned = parsed.filter(row =>
          row["房源名称"] && row["内部名称"]
        );
        parsedRows.push(...cleaned);
      }
      setSummary(parsedRows);
    };

    processFiles();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Airbnb 收入汇总工具（月度报告）
      </h1>
      <input type="file" accept=".csv" multiple onChange={handleFileUpload} />
      <div style={{ marginTop: "2rem" }}>
        <table width="100%" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>房源名称</th>
              <th>内部名称</th>
              <th>货币</th>
              <th>预订额</th>
              <th>获订晚数</th>
              <th>日均价</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row, index) => (
              <tr key={index}>
                <td>{row["房源名称"]}</td>
                <td>{row["内部名称"]}</td>
                <td>{row["货币"]}</td>
                <td>{row["预订额"]}</td>
                <td>{row["获订晚数"]}</td>
                <td>{row["日均价"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
