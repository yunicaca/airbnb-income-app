import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function MonthlyDetailAnalysis() {
  const [bookings, setBookings] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [nicknameFilter, setNicknameFilter] = useState('');

  const parseFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const fileName = file.name;
        const match = fileName.match(/(\d{2})-(\d{4})/);
        let year = '', month = '';
        if (match) {
          [_, month, year] = match;
        }
        const targetMonth = `${year}-${month}`;
        const startBoundary = new Date(`${targetMonth}-01`);
        const endBoundary = new Date(`${targetMonth}-01`);
        endBoundary.setMonth(endBoundary.getMonth() + 1);

        const parsed = json
          .filter(row => row['Type'] === 'Reservation')
          .map(row => {
            const start = new Date(row['Start date']);
            const end = new Date(row['End date']);
            const nights = (end - start) / (1000 * 3600 * 24);
            const totalDeduct = (parseFloat(row['Cleaning fee']) || 0)
              + (parseFloat(row['Service fee']) || 0)
              + (parseFloat(row['Pet fee']) || 0);
            const gross = parseFloat(row['Gross earnings']) || 0;
            const dailyRate = nights > 0 ? (gross - totalDeduct) / nights : 0;
            const overlapStart = start > startBoundary ? start : startBoundary;
            const overlapEnd = end < endBoundary ? end : endBoundary;
            const monthNights = (overlapEnd - overlapStart) / (1000 * 3600 * 24);
            const revenue = dailyRate * (monthNights > 0 ? monthNights : 0);

            return {
              nickname: row['Listing'],
              confirmation: row['Confirmation code'],
              startDate: row['Start date'],
              endDate: row['End date'],
              dailyRate: dailyRate.toFixed(2),
              aprilNights: monthNights > 0 ? monthNights : 0,
              revenue: revenue.toFixed(2),
              targetMonth
            };
          });

        resolve(parsed);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    const all = [];
    for (const file of files) {
      const result = await parseFile(file);
      all.push(...result);
    }
    setBookings(all);
  };

  const filtered = bookings.filter(row => {
    const matchMonth = monthFilter ? row.targetMonth === monthFilter : true;
    const matchNick = nicknameFilter ? row.nickname.includes(nicknameFilter) : true;
    return matchMonth && matchNick;
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Airbnb 当月详细预订分析</h2>
      <input type="file" accept=".xlsx,.xls" multiple onChange={handleUpload} />

      <div style={{ marginTop: '10px' }}>
        筛选月份：<input type="month" onChange={e => setMonthFilter(e.target.value)} />
        &nbsp;&nbsp;
        筛选昵称关键词：<input type="text" placeholder="如: 1330" onChange={e => setNicknameFilter(e.target.value)} />
      </div>

      <table border="1" cellPadding="5" style={{ marginTop: '10px', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>昵称</th>
            <th>确认号</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>当月入住天数</th>
            <th>Daily Rate</th>
            <th>当月收入</th>
            <th>所属月份</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, idx) => (
            <tr key={idx}>
              <td>{row.nickname}</td>
              <td>{row.confirmation}</td>
              <td>{row.startDate}</td>
              <td>{row.endDate}</td>
              <td>{row.aprilNights}</td>
              <td>{row.dailyRate}</td>
              <td>{row.revenue}</td>
              <td>{row.targetMonth}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MonthlyDetailAnalysis;
