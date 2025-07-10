import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";

export default function AirbnbIncomeSummary() {
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
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Airbnb Income Summary</h1>
      <Input type="file" accept=".csv" multiple onChange={handleFileUpload} />
      <Card className="mt-6">
        <CardContent>
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-left p-2">房源 - 月份</th>
                <th className="text-right p-2">收入</th>
                <th className="text-right p-2">入住晚数</th>
                <th className="text-right p-2">平均每晚</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary).map(([key, val]) => (
                <tr key={key} className="border-t">
                  <td className="p-2">{key}</td>
                  <td className="text-right p-2">${val.income.toFixed(2)}</td>
                  <td className="text-right p-2">{val.nights}</td>
                  <td className="text-right p-2">
                    {val.nights > 0 ? "$" + (val.income / val.nights).toFixed(2) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

