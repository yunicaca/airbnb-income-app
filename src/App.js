import { useState } from "react";
import Papa from "papaparse";

function App() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});

  const handleFileUpload = (e) => {
    const files = e.target.files;
    const allData = [];

    const parseFile = (file) => {
      return new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          },
        });
      });
    };

    const processFiles = async () => {
      for (const file of files) {
        const parsed = await parseFile(file);
        allData.push(...parsed);
      }
      setData(allData);
      generateSummary(allData);
    };

    processFiles();
  };

  const generateSummary = (records) => {
    const monthlySummary = {};

    records.forEach((entry) => {
      const property = entry["Listing"] || "Unknown Property";
      const payout = parseFloat(entry["Payout"] || 0);
      const checkIn = new Date(entry["Check-in"]);
      const nights = parseInt(entry["Nights"] || 0);
      if (isNaN(payout) || isNaN(checkIn.getTime())) return;

      const key = `${property} - ${checkIn.getFullYear()}-${(checkIn.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      if (!monthlySummary[key]) {
        monthlySummary[key] = { income: 0, nights: 0, count: 0 };
      }

      monthlySummary[key].income += payout;
      monthlySummary[key].nights += nights;
      monthlySummary[key].count += 1;
    });

    setSummary(monthlySummary);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Airbnb 收入汇总工具
      </h1>
      <input type="file" accept=".csv" multiple onChange={handleFileUpload} />
      <div style={{ marginTop: "2rem" }}>
        <table width="100%" border="1" cellPadding="8">
          <thead>
            <tr>
              <th>房源 - 月份</th>
              <th>收入</th>
              <th>入住晚数</th>
              <th>每晚平均收入</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(summary).map(([key, val]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>${val.income.toFixed(2)}</td>
                <td>{val.nights}</td>
                <td>
                  {val.nights > 0
                    ? "$" + (val.income / val.nights).toFixed(2)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
