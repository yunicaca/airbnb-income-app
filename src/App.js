import React, { useState } from 'react';
import Papa from 'papaparse';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const allResults = [];
    let filesParsed = 0;

    Array.from(files).forEach(file => {
      const monthMatch = file.name.match(/(\d{4}-\d{2})/);
      const inferredMonth = monthMatch ? monthMatch[1] : '';

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        beforeFirstChunk: (chunk) => {
          const lines = chunk.split('\n');
          if (lines[0].includes('从') && lines[0].includes('的月度报告')) {
            return lines.slice(1).join('\n');
          }
          return chunk;
        },
        complete: function (results) {
          const withMonth = results.data.map(row => ({ ...row, '月份': inferredMonth }));
          allResults.push(...withMonth);
          filesParsed++;

          if (filesParsed === files.length) {
            setData(allResults);
            setFilteredData(allResults);
          }
        }
      });
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
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      <h2 className="text-2xl font-bold mb-6">Airbnb 收入汇总工具（月度报告）</h2>

      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 mb-4">
        <input type="file" accept=".csv" multiple onChange={handleFileUpload} className="block" />

        <input type="month" className="border p-2 rounded w-48" onChange={e => setMonthFilter(e.target.value)} />

        <input type="text" className="border p-2 rounded w-48" placeholder="例如: 14" onChange={e => setKeywordFilter(e.target.value)} />

        <button onClick={handleFilter} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">筛选</button>
      </div>

      <div className="mb-4 font-medium">筛选后预订额总价：<span className="text-green-600 font-bold">¥{totalBookingAmount.toLocaleString()}</span></div>

      <div className="overflow-auto">
        <table className="min-w-full border text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">房源名称</th>
              <th className="px-4 py-2 border">内部名称</th>
              <th className="px-4 py-2 border">货币</th>
              <th className="px-4 py-2 border">预订额</th>
              <th className="px-4 py-2 border">获订晚数</th>
              <th className="px-4 py-2 border">日均价</th>
              <th className="px-4 py-2 border">月份</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{row['房源名称']}</td>
                <td className="px-4 py-2 border">{row['内部名称']}</td>
                <td className="px-4 py-2 border">{row['货币']}</td>
                <td className="px-4 py-2 border">{row['预订额']}</td>
                <td className="px-4 py-2 border">{row['获订晚数']}</td>
                <td className="px-4 py-2 border">{row['日均价']}</td>
                <td className="px-4 py-2 border">{row['月份']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
