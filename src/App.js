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
          const lines = text.split("\n");
          const titleLine = lines[0]; // 第一行是标题
          const dataPart = lines.slice(1).join("\n"); // 剩下的才是 CSV 表头 + 数据

          const monthMatch = titleLine.match(/\d{4}-\d{2}/);
          const extractedMonth = monthMatch ? monthMatch[0] : "";

          Papa.parse(dataPart, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              // 给每一行加上识别出来的月份信息
              const cleaned = results.data
                .filter(row => row["房源名称"] && row["内部名称"] && row["预订额"])
                .map(row => ({
                  ...row,
                  _month: extractedMonth
                }));
              resolve(cleaned);
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
      const matchesMonth = !monthFilter || row._month === monthFilter;
      const matchesKeyword = !keywordFilter || (row["内部名称"] || "").includes(keywordFilter);
      return matchesMonth && matchesKeyword;
    });
  }, [rawData, monthFilter, keywordFilter]);

  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + parseFloat(row["预订额"] || 0), 0);
  }, [filteredData]);

  const uniqueMonths = Array.from(
    new Set(rawData.map((row) => row._month).filter(Boolean))
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Airbnb 收入汇总工具（月度报告）
      </h1>
      <input type="file" accept=".csv" multiple onChange={handleFileUpload} />

      {rawData.length > 0 && (
        <>
          <div style={{ marginTop: "1rem" }}>
            <label>
              筛选月份：
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value=\"\">全部</option>
                {uniqueMonths.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label style={{ marginLeft: "2rem" }}>
              内部名称关键词（如14）：
              <input
                type=\"text\"
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginTop: \"1rem\", fontWeight: \"bold\" }}>
            当前筛选预订额总计：${totalAmount.toFixed(2)}
          </div>

          <div style={{ marginTop: \"1rem\" }}>
            <table width=\"100%\" border=\"1\" cellPadding=\"8\">
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
                    <td>{row._month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
