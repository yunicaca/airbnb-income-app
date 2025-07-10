import { useState, useMemo } from "react";
import Papa from "papaparse";

function App() {
  const [rawData, setRawData] = useState([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");

  const handleFileUpload = (e) => {
    const files = e.target.files;

    const parseFile = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result;
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
      setRawData(allRows);
    };

    processFiles();
  };

  const filteredData = useMemo(() => {
    return rawData.filter((row) => {
      const month = extractMonthFromTitle(row);
      const matchesMonth = !monthFilter || month === monthFilter;
      const matchesKeyword = !keywordFilter || (row["内部名称"] || "").includes(keywordFilter);
      return matchesMonth && matchesKeyword;
    });
  }, [rawData, monthFilter, keywordFilter]);

  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + parseFloat(row["预订额"] || 0), 0);
  }, [filteredData]);

  const extractMonthFromTitle = (row) => {
    const fullTitle = row["\u4ece2025-02-01\u52302025-02-28\u7684\u6708\u5ea6\u62a5\u544a"] || "";
    const match = fullTitle.match(/\d{4}-\d{2}/);
    return match ? match[0] : "";
  };

  const uniqueMonths = Array.from(
    new Set(rawData.map((row) => extractMonthFromTitle(row)).filter(Boolean))
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Airbnb 收入汇总工具（月度报告）
      </h1>
      <input type="file" accept=".csv" multiple onChange={handleFileUpload} />

      <div style={{ marginTop: "1rem" }}>
        <label>
          筛选月份：
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">全部</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: "2rem" }}>
          筛选内部名称关键词（如14）：
          <input
            type="text"
            value={keywordFilter}
            onChange={(e) => setKeywordFilter(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
        当前筛选预订额总计：${totalAmount.toFixed(2)}
      </div>

      <div style={{ marginTop: "1rem" }}>
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
            {filteredData.map((row, index) => (
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
