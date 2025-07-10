import { useState } from "react";
import Papa from "papaparse";

function App() {
  const [summary, setSummary] = useState([]);

  const handleFileUpload = (e) => {
    const files = e.target.files;

    const parseFile = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
          // 跳过第一行后重新处理
          const lines = text.split("\n").slice(1).join("\n");
          Papa.parse(lines, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              resolve(results.data);
            },
          });
        };
        reader.readAsText(file);
      });
    };

    const processFiles = async () => {
      let allRows = [];
      for (const file of files) {
        const parsed = await parseFile(file);
        allRows.push(...parsed);
      }
      setSummary(allRows);
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
