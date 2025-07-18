import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// 安全的数值格式化函数
const safeToFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

// 安全的数值转换函数
const safeNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// 预订明细分析组件
function MonthlyDetailAnalysis() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [nickNameFilter, setNickNameFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // 从文件名提取月份
  const extractMonthFromFileName = (fileName) => {
    const patterns = [
      /(\d{1,2})[_\-](\d{4})/,
      /(\d{4})[_\-](\d{1,2})/,
      /(\d{1,2})\/(\d{4})/,
      /(\d{4})\/(\d{1,2})/
    ];

    for (let pattern of patterns) {
      const match = fileName.match(pattern);
      if (match) {
        let month, year;
        if (match[1].length === 4) {
          year = parseInt(match[1]);
          month = parseInt(match[2]);
        } else {
          month = parseInt(match[1]);
          year = parseInt(match[2]);
        }
        
        if (year >= 2020 && year <= 2030 && month >= 1 && month <= 12) {
          return {
            year,
            month,
            monthString: `${year}-${month.toString().padStart(2, '0')}`
          };
        }
      }
    }
    return null;
  };

  // 计算某个月的天数
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // 计算订单在指定月份的入住天数
  const calculateDaysInMonth = (startDate, endDate, targetYear, targetMonth) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    const overlapStart = start < monthStart ? monthStart : start;
    const overlapEnd = end > monthEnd ? monthEnd : end;
    
    if (overlapStart > overlapEnd) {
      return 0;
    }
    
    const timeDiff = overlapEnd.getTime() - overlapStart.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    
    const maxDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const result = Math.min(Math.max(0, daysDiff), maxDaysInMonth);
    
    return result;
  };

  // 处理Excel文件上传
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    let allData = [];

    try {
      for (const file of files) {
        const monthInfo = extractMonthFromFileName(file.name);
        if (!monthInfo) {
          alert(`无法从文件名 "${file.name}" 中提取月份信息，请确保文件名包含月份格式（如：04_2024）`);
          continue;
        }

        console.log(`处理文件: ${file.name}, 月份: ${monthInfo.monthString}`);

        const arrayBuffer = await file.arrayBuffer();
        const workbookData = await parseExcelFile(arrayBuffer, monthInfo, file.name);
        
        allData = [...allData, ...workbookData];
      }

      setData(allData);
      setFilteredData(allData);
      console.log(`处理完成，共 ${allData.length} 条记录`);
    } catch (error) {
      console.error('文件处理错误:', error);
      alert('文件处理失败，请检查文件格式');
    } finally {
      setLoading(false);
    }
  };

  // 解析Excel中的日期
  const parseExcelDate = (dateValue) => {
    if (!dateValue) return '';
    
    if (typeof dateValue === 'number' && dateValue > 1) {
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    
    return '';
  };
  
  // 清理数值字符串
  const cleanNumericValue = (value) => {
    if (value === null || value === undefined) return '0';
    return value.toString().replace(/[$,\s%]/g, '').replace(/[^\d.-]/g, '') || '0';
  };

  // Excel文件解析函数
  const parseExcelFile = async (arrayBuffer, monthInfo, fileName) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('Excel原始数据:', jsonData.slice(0, 5));
      
      let headerRowIndex = -1;
      let headers = [];
      
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && Array.isArray(row)) {
          const rowStr = row.join('').toLowerCase();
          if (rowStr.includes('start') || rowStr.includes('end') || 
              rowStr.includes('guest') || rowStr.includes('nick') ||
              rowStr.includes('earning') || rowStr.includes('gross') ||
              rowStr.includes('check')) {
            headerRowIndex = i;
            headers = row.map(cell => (cell || '').toString().trim());
            break;
          }
        }
      }
      
      if (headerRowIndex === -1) {
        throw new Error('未找到有效的表头行');
      }
      
      console.log('找到表头:', headers);
      
      const fieldMapping = {
        nickName: ['nickname', 'nick name', 'property name', 'listing name'],
        guestName: ['guest name', 'first name', 'guest', 'customer name'],
        startDate: ['start date', 'check in date', 'checkin date', 'arrival date'],
        endDate: ['end date', 'check out date', 'checkout date', 'departure date'],
        totalNights: ['nights', 'number of nights', 'stay duration', 'total nights', 'length of stay', 'duration'],
        grossEarning: ['gross earnings', 'gross earning', 'total earnings', 'earnings', 'gross revenue'],
        cleaningFee: ['cleaning fee', 'cleaning fees'],
        serviceFee: ['service fee', 'service fees', 'airbnb fee', 'platform fee'],
        petFee: ['pet fee', 'pet fees', 'additional fee'],
        rate: ['nightly rate', 'daily rate', 'base rate']
      };
      
      const fieldIndexes = {};
      Object.keys(fieldMapping).forEach(field => {
        const possibleNames = fieldMapping[field];
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i].toLowerCase().trim();
          if (possibleNames.some(name => {
            const nameLower = name.toLowerCase();
            return header === nameLower || header.includes(nameLower);
          })) {
            if (!fieldIndexes[field]) {
              fieldIndexes[field] = i;
            }
          }
        }
      });
      
      console.log('字段映射结果:', fieldIndexes);
      
      const parsedData = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row) || row.every(cell => !cell)) {
          continue;
        }
        
        const booking = {
          id: `${monthInfo.monthString}_${i}`,
          fileName: fileName,
          month: monthInfo.monthString,
          year: monthInfo.year,
          monthNum: monthInfo.month,
          
          nickName: fieldIndexes.nickName !== undefined ? (row[fieldIndexes.nickName] || '').toString().trim() : '',
          guestName: fieldIndexes.guestName !== undefined ? (row[fieldIndexes.guestName] || '').toString().trim() : '',
          
          startDate: parseExcelDate(row[fieldIndexes.startDate]),
          endDate: parseExcelDate(row[fieldIndexes.endDate]),
          
          grossEarning: parseFloat(cleanNumericValue(row[fieldIndexes.grossEarning])) || 0,
          cleaningFee: parseFloat(cleanNumericValue(row[fieldIndexes.cleaningFee])) || 0,
          serviceFee: parseFloat(cleanNumericValue(row[fieldIndexes.serviceFee])) || 0,
          petFee: parseFloat(cleanNumericValue(row[fieldIndexes.petFee])) || 0,
          
          totalNights: parseInt(cleanNumericValue(row[fieldIndexes.totalNights])) || 0,
          rate: parseFloat(cleanNumericValue(row[fieldIndexes.rate])) || 0
        };
        
        if (booking.nickName && (booking.startDate || booking.endDate)) {
          parsedData.push(booking);
        }
      }
      
      console.log(`成功解析 ${parsedData.length} 条预订记录`);
      return parsedData;
      
    } catch (error) {
      console.error('Excel解析错误:', error);
      throw new Error(`Excel文件解析失败: ${error.message}`);
    }
  };

  // 处理数据，计算衍生字段
  const processBookingData = (rawData) => {
    return rawData.map(booking => {
      let daysInTargetMonth = safeNumber(booking.daysInTargetMonth);
      if (daysInTargetMonth === 0 && booking.startDate && booking.endDate) {
        daysInTargetMonth = calculateDaysInMonth(
          booking.startDate, 
          booking.endDate, 
          booking.year, 
          booking.monthNum
        );
      }
      
      let totalActualNights = safeNumber(booking.totalNights);
      if (totalActualNights === 0 && booking.startDate && booking.endDate) {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        totalActualNights = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)));
      }
      
      totalActualNights = Math.max(1, totalActualNights);
      
      const grossEarning = safeNumber(booking.grossEarning);
      const cleaningFee = safeNumber(booking.cleaningFee);
      const serviceFee = safeNumber(booking.serviceFee);
      const petFee = safeNumber(booking.petFee);
      
      const netAmount = grossEarning - cleaningFee - serviceFee - petFee;
      const actualDailyRate = totalActualNights > 0 ? netAmount / totalActualNights : 0;
      const monthlyRevenue = actualDailyRate * daysInTargetMonth;

      return {
        ...booking,
        grossEarning: grossEarning,
        cleaningFee: cleaningFee,
        serviceFee: serviceFee,
        petFee: petFee,
        daysInTargetMonth: daysInTargetMonth,
        totalActualNights: totalActualNights,
        actualDailyRate: actualDailyRate,
        monthlyRevenue: monthlyRevenue,
        netAmount: netAmount
      };
    });
  };

  // 筛选功能
  const handleFilter = () => {
    let filtered = data;
    
    if (monthFilter) {
      filtered = filtered.filter(item => item.month === monthFilter);
    }
    
    if (nickNameFilter) {
      filtered = filtered.filter(item => 
        item.nickName && item.nickName.toLowerCase().includes(nickNameFilter.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  };

  // 计算房源入住率统计
  const calculatePropertyOccupancy = () => {
    const propertyStats = {};
    
    const processedFilteredData = processBookingData(filteredData);
    
    // 按房源和月份分组
    processedFilteredData.forEach(booking => {
      const key = `${booking.nickName}_${booking.month}`;
      if (!propertyStats[key]) {
        propertyStats[key] = {
          nickName: booking.nickName,
          month: booking.month,
          year: booking.year,
          monthNum: booking.monthNum,
          monthDays: getDaysInMonth(booking.year, booking.monthNum),
          totalRevenue: 0,
          bookingCount: 0,
          occupiedDates: new Set() // 使用Set来记录已占用的日期，避免重复计算
        };
      }
      
      // 记录该订单在目标月份的每一天
      if (booking.startDate && booking.endDate) {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const monthStart = new Date(booking.year, booking.monthNum - 1, 1);
        const monthEnd = new Date(booking.year, booking.monthNum, 0);
        
        // 计算实际在该月的起止日期
        const actualStart = start < monthStart ? monthStart : start;
        const actualEnd = end > monthEnd ? monthEnd : end;
        
        // 记录每一天的占用情况
        for (let d = new Date(actualStart); d <= actualEnd; d.setDate(d.getDate() + 1)) {
          const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
          propertyStats[key].occupiedDates.add(dateKey);
        }
      }
      
      propertyStats[key].totalRevenue += safeNumber(booking.monthlyRevenue);
      propertyStats[key].bookingCount += 1;
    });

    // 计算实际入住天数和入住率
    return Object.values(propertyStats).map(property => {
      const actualOccupiedDays = property.occupiedDates.size;
      return {
        nickName: property.nickName,
        month: property.month,
        totalDaysInMonth: actualOccupiedDays, // 实际入住天数（去重后）
        monthDays: property.monthDays,
        totalRevenue: property.totalRevenue,
        bookingCount: property.bookingCount,
        occupancyRate: property.monthDays > 0 ? 
          safeToFixed((actualOccupiedDays / property.monthDays) * 100) : '0.00'
      };
    });
  };

  const propertyOccupancy = calculatePropertyOccupancy();
  const processedData = processBookingData(filteredData);

  return (
    <div style={{ padding: '20px' }}>
      <h2>预订明细分析</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>📁 上传Excel文件</h3>
        <input 
          type="file" 
          accept=".xlsx,.xls" 
          multiple 
          onChange={handleFileUpload}
          disabled={loading}
        />
        <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
          支持批量上传Excel文件，文件名应包含月份信息（如：Doris airbnb 04_2024.xlsx）
        </p>
        {loading && <p style={{ color: '#007bff' }}>正在处理文件...</p>}
      </div>

      {data.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
          <h3>🔍 筛选条件</h3>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              按月份筛选：
              <select 
                value={monthFilter} 
                onChange={e => setMonthFilter(e.target.value)}
                style={{ marginLeft: '5px', padding: '5px' }}
              >
                <option value="">全部月份</option>
                {[...new Set(data.map(item => item.month))].sort().map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </label>
            
            <label>
              按Nick Name筛选：
              <input 
                type="text" 
                placeholder="如：1330" 
                value={nickNameFilter}
                onChange={e => setNickNameFilter(e.target.value)}
                style={{ marginLeft: '5px', padding: '5px', width: '120px' }}
              />
            </label>
            
            <button 
              onClick={handleFilter}
              style={{
                padding: '8px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              应用筛选
            </button>
            
            <button 
              onClick={() => {
                setMonthFilter('');
                setNickNameFilter('');
                setFilteredData(data);
              }}
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              清除筛选
            </button>
          </div>
        </div>
      )}

      {propertyOccupancy.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>🏠 各房源当月入住率统计</h3>
          <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>房源名称</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>月份</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>当月入住天数</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>月总天数</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>入住率</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>当月收益</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>订单数</th>
                </tr>
              </thead>
              <tbody>
                {propertyOccupancy.map((property, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{property.nickName}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{property.month}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{property.totalDaysInMonth}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{property.monthDays}</td>
                    <td style={{ 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: parseFloat(property.occupancyRate) > 70 ? '#28a745' : 
                            parseFloat(property.occupancyRate) > 40 ? '#ffc107' : '#dc3545'
                    }}>
                      {property.occupancyRate}%
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                      ${safeToFixed(property.totalRevenue)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{property.bookingCount}</td>
                  </tr>
                ))}
                {/* 汇总行 */}
                <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    合计 ({propertyOccupancy.length} 个房源)
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {propertyOccupancy.reduce((sum, p) => sum + p.totalDaysInMonth, 0)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {propertyOccupancy.reduce((sum, p) => sum + p.monthDays, 0)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'center',
                    color: '#17a2b8'
                  }}>
                    {(() => {
                      const totalOccupiedDays = propertyOccupancy.reduce((sum, p) => sum + p.totalDaysInMonth, 0);
                      const totalPossibleDays = propertyOccupancy.reduce((sum, p) => sum + p.monthDays, 0);
                      return totalPossibleDays > 0 ? 
                        safeToFixed((totalOccupiedDays / totalPossibleDays) * 100) + '%' : '0.00%';
                    })()}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    textAlign: 'right',
                    color: '#28a745',
                    fontSize: '16px'
                  }}>
                    ${safeToFixed(propertyOccupancy.reduce((sum, p) => sum + p.totalRevenue, 0))}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {propertyOccupancy.reduce((sum, p) => sum + p.bookingCount, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* 筛选条件提示 */}
          {(monthFilter || nickNameFilter) && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#d4edda', 
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              <strong>当前筛选条件：</strong>
              {monthFilter && <span style={{ marginLeft: '10px' }}>月份: {monthFilter}</span>}
              {nickNameFilter && <span style={{ marginLeft: '10px' }}>房源: {nickNameFilter}</span>}
              <br />
              <strong>筛选结果汇总：</strong>
              <span style={{ marginLeft: '10px', color: '#28a745', fontSize: '16px', fontWeight: 'bold' }}>
                当月总收益: ${safeToFixed(propertyOccupancy.reduce((sum, p) => sum + p.totalRevenue, 0))}
              </span>
            </div>
          )}
        </div>
      )}

      {processedData.length > 0 && (
        <div>
          <h3>📋 预订明细 (共 {processedData.length} 条)</h3>
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #ddd' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f9fa', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '120px' }}>房源名称</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '100px' }}>客人姓名</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '100px' }}>开始日期</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '100px' }}>结束日期</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '80px' }}>订单总天数</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '80px' }}>当月天数</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '100px' }}>总收入</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '80px' }}>清洁费</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '80px' }}>服务费</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '80px' }}>宠物费</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '100px' }}>净收入</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '100px' }}>实际日均价</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '100px' }}>当月收益</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '80px' }}>文件来源</th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((booking, idx) => (
                  <tr key={booking.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{booking.nickName}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd' }}>{booking.guestName}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{booking.startDate}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{booking.endDate}</td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                      {booking.totalActualNights}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#007bff' }}>
                      {booking.daysInTargetMonth}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      ${safeToFixed(booking.grossEarning)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      ${safeToFixed(booking.cleaningFee)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      ${safeToFixed(booking.serviceFee)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>
                      ${safeToFixed(booking.petFee)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#17a2b8' }}>
                      ${safeToFixed(booking.netAmount)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#6f42c1' }}>
                      ${safeToFixed(booking.actualDailyRate)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                      ${safeToFixed(booking.monthlyRevenue)}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '11px', color: '#666' }}>
                      {booking.fileName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <h3>📊 使用说明</h3>
          <ol style={{ textAlign: 'left', display: 'inline-block', margin: '20px 0' }}>
            <li>上传包含预订明细的Excel文件</li>
            <li>确保文件名包含月份信息（如：04_2024）</li>
            <li>系统将自动计算当月入住天数和收益</li>
            <li>可按月份和房源名称进行筛选</li>
          </ol>
        </div>
      )}
    </div>
  );
}

// 月度汇总组件
function MonthlySummary() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');

  const getDaysInMonth = (monthStr) => {
    if (!monthStr) return 30;
    const [year, month] = monthStr.split('-').map(Number);
    if (!year || !month) return 30;
    return new Date(year, month, 0).getDate();
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    let allData = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const content = event.target.result;
        const lines = content.split('\n').filter(line => line.trim());

        let month = '';
        
        const fileNamePatterns = [
          /(\d{4})-(\d{1,2})\.csv$/i,
          /(\d{4})年(\d{1,2})月/,
          /(\d{4})_(\d{1,2})/,
          /(\d{4})\.(\d{1,2})/
        ];
        
        for (let pattern of fileNamePatterns) {
          const match = file.name.match(pattern);
          if (match) {
            const year = parseInt(match[1]);
            const monthNum = parseInt(match[2]);
            if (year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12) {
              month = `${year}-${monthNum.toString().padStart(2, '0')}`;
              break;
            }
          }
        }
        
        if (!month) {
          for (let i = 0; i < Math.min(10, lines.length); i++) {
            const contentPatterns = [
              /(\d{4})[年\-](\d{1,2})[月\-]/,
              /(\d{4})\/(\d{1,2})/,
              /月份[：:]?\s*(\d{4})[年\-](\d{1,2})/
            ];
            
            for (let pattern of contentPatterns) {
              const match = lines[i].match(pattern);
              if (match) {
                const year = parseInt(match[1]);
                const monthNum = parseInt(match[2]);
                if (year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12) {
                  month = `${year}-${monthNum.toString().padStart(2, '0')}`;
                  break;
                }
              }
            }
            if (month) break;
          }
        }
        
        if (!month) {
          const userInput = prompt(
            `无法从文件 "${file.name}" 中识别月份信息。\n\n请输入该文件对应的月份（格式：YYYY-MM）：\n例如：2024-01, 2024-12`,
            '2024-01'
          );
          
          if (userInput) {
            const userMatch = userInput.match(/^(\d{4})-(\d{1,2})$/);
            if (userMatch) {
              const year = parseInt(userMatch[1]);
              const monthNum = parseInt(userMatch[2]);
              if (year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12) {
                month = `${year}-${monthNum.toString().padStart(2, '0')}`;
              }
            }
          }
          
          if (!month) {
            alert(`文件 ${file.name} 的月份格式不正确，将跳过此文件`);
            filesProcessed++;
            if (filesProcessed === files.length && allData.length > 0) {
              setData(allData);
              setFilteredData(allData);
            }
            return;
          }
        }

        console.log(`✅ 文件 "${file.name}" 识别的月份: ${month}`);

        let headerIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          if (line.includes('房源名称') || line.includes('内部名称') || line.includes('预订额') || 
              line.includes('property') || line.includes('booking')) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex === -1) {
          console.log(`❌ 文件 ${file.name} 未找到有效的CSV表头`);
          filesProcessed++;
          if (filesProcessed === files.length && allData.length > 0) {
            setData(allData);
            setFilteredData(allData);
          }
          return;
        }

        const headers = lines[headerIndex].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataLines = lines.slice(headerIndex + 1);
        
        console.log(`📋 文件 "${file.name}" 表头:`, headers);

        const rows = dataLines.map(line => {
          const values = [];
          let current = '';
          let inQuotes = false;
          
          for (let char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim().replace(/"/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/"/g, ''));

          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          obj['月份'] = month;
          obj['文件名'] = file.name;
          return obj;
        }).filter(row => {
          return Object.values(row).some(val => val && val.trim() && val !== month && val !== file.name);
        });

        console.log(`📊 文件 "${file.name}" 解析了 ${rows.length} 行有效数据`);
        allData = [...allData, ...rows];
        filesProcessed++;

        if (filesProcessed === files.length) {
          console.log(`🎉 所有 ${files.length} 个文件处理完成，总数据: ${allData.length} 条`);
          setData(allData);
          setFilteredData(allData);
        }
      };
      reader.readAsText(file, 'UTF-8');
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

  const calculateDetailedOccupancy = () => {
    if (filteredData.length === 0) return { roomOccupancy: [], overallOccupancy: '0.00' };

    const roomStats = {};
    
    filteredData.forEach(row => {
      const propertyName = row['房源名称'] || '';
      const internalName = row['内部名称'] || '';
      const nights = parseInt(row['获订晚数']) || 0;
      const month = row['月份'];
      
      if (!month || !propertyName) return;
      
      const roomKey = `${propertyName} - ${internalName}`;
      
      if (!roomStats[roomKey]) {
        roomStats[roomKey] = {
          propertyName,
          internalName,
          month,
          totalNights: 0,
          daysInMonth: getDaysInMonth(month),
          occupancyRate: 0
        };
      }
      
      roomStats[roomKey].totalNights += nights;
    });

    const roomOccupancy = Object.values(roomStats).map(room => {
      room.occupancyRate = room.daysInMonth > 0 
        ? ((room.totalNights / room.daysInMonth) * 100).toFixed(2)
        : '0.00';
      return room;
    });

    const totalPossibleNights = roomOccupancy.reduce((sum, room) => sum + room.daysInMonth, 0);
    const totalBookedNights = roomOccupancy.reduce((sum, room) => sum + room.totalNights, 0);
    const overallOccupancy = totalPossibleNights > 0 
      ? ((totalBookedNights / totalPossibleNights) * 100).toFixed(2)
      : '0.00';

    return { roomOccupancy, overallOccupancy };
  };

  const occupancyData = calculateDetailedOccupancy();
  const occupancyRate = occupancyData.overallOccupancy;

  const totalBookingAmount = filteredData.reduce((sum, row) => {
    const amount = parseFloat(row['预订额']?.replace(/[^\d.]/g, '') || 0);
    return sum + amount;
  }, 0);

  const totalNights = filteredData.reduce((sum, row) => {
    return sum + (parseInt(row['获订晚数']) || 0);
  }, 0);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Airbnb 收入汇总工具（月度报告）</h2>
      <input type="file" accept=".csv" multiple onChange={handleFileUpload} />

      <div style={{ marginTop: '10px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            按月份筛选：
            <input 
              type="month" 
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              style={{ marginLeft: '5px', padding: '5px' }}
            />
          </label>
          
          <label>
            按房源关键词筛选（内部名称）：
            <input 
              type="text" 
              placeholder="例如: 14" 
              value={keywordFilter}
              onChange={e => setKeywordFilter(e.target.value)}
              style={{ marginLeft: '5px', padding: '5px', width: '150px' }}
            />
          </label>
          
          <button 
            onClick={handleFilter}
            style={{
              padding: '8px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            筛选
          </button>
          
          <button 
            onClick={() => {
              setMonthFilter('');
              setKeywordFilter('');
              setFilteredData(data);
            }}
            style={{
              padding: '8px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            清除筛选
          </button>
        </div>
      </div>

      <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <strong>统计信息：</strong><br />
        <div style={{ marginTop: '10px' }}>
          筛选后预订额总价：<span style={{ color: '#28a745', fontWeight: 'bold' }}>¥{totalBookingAmount.toLocaleString()}</span><br />
          筛选后总入住晚数：<span style={{ color: '#007bff', fontWeight: 'bold' }}>{totalNights}</span><br />
          筛选后入住率：<span style={{ color: '#dc3545', fontWeight: 'bold' }}>{occupancyRate}%</span><br />
          <small style={{ color: '#666' }}>
            数据条数：{filteredData.length} | 
            {monthFilter && ` 月份：${monthFilter} |`}
            {keywordFilter && ` 关键词：${keywordFilter}`}
          </small>
        </div>
      </div>

      <div style={{ marginTop: '15px' }}>
        <h3>数据详情（显示全部 {filteredData.length} 条）</h3>
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto', border: '1px solid #ddd' }}>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f9fa', zIndex: 10 }}>
              <tr>
                <th>房源名称</th>
                <th>内部名称</th>
                <th>货币</th>
                <th>预订额</th>
                <th>获订晚数</th>
                <th>日均价</th>
                <th>月份</th>
                <th>月总天数</th>
                <th>房间入住率</th>
                <th>文件来源</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const month = row['月份'];
                const nights = parseInt(row['获订晚数']) || 0;
                const daysInMonth = getDaysInMonth(month);
                const roomOccupancy = daysInMonth > 0 ? ((nights / daysInMonth) * 100).toFixed(2) : '0.00';
                
                return (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row['房源名称'] || ''}
                    </td>
                    <td>{row['内部名称'] || ''}</td>
                    <td>{row['货币'] || ''}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {row['预订额'] || '0'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {nights}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {row['日均价'] || ''}
                    </td>
                    <td style={{ 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      color: month && month.match(/^\d{4}-\d{2}$/) ? '#28a745' : '#dc3545'
                    }}>
                      {month || '未知'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {daysInMonth}
                    </td>
                    <td style={{ 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      color: parseFloat(roomOccupancy) > 70 ? '#28a745' : 
                            parseFloat(roomOccupancy) > 40 ? '#ffc107' : '#dc3545'
                    }}>
                      {roomOccupancy}%
                    </td>
                    <td style={{ fontSize: '12px', color: '#666', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row['文件名'] || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {occupancyData.roomOccupancy.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>各房间入住率汇总</h3>
          <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd' }}>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ position: 'sticky', top: '0', backgroundColor: '#e9ecef', zIndex: 10 }}>
                <tr>
                  <th>房源名称</th>
                  <th>内部名称</th>
                  <th>月份</th>
                  <th>入住天数</th>
                  <th>月总天数</th>
                  <th>入住率</th>
                </tr>
              </thead>
              <tbody>
                {occupancyData.roomOccupancy
                  .sort((a, b) => parseFloat(b.occupancyRate) - parseFloat(a.occupancyRate))
                  .map((room, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {room.propertyName}
                      </td>
                      <td>{room.internalName}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>
                        {room.month}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {room.totalNights}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {room.daysInMonth}
                      </td>
                      <td style={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        color: parseFloat(room.occupancyRate) > 70 ? '#28a745' : 
                              parseFloat(room.occupancyRate) > 40 ? '#ffc107' : '#dc3545'
                      }}>
                        {room.occupancyRate}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// 主应用组件
function App() {
  const [currentPage, setCurrentPage] = useState('summary');

  const renderPage = () => {
    switch(currentPage) {
      case 'details':
        return <MonthlyDetailAnalysis />;
      case 'summary':
      default:
        return <MonthlySummary />;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🏠 Airbnb 工具导航</h1>
      
      <nav style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setCurrentPage('summary')} 
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: currentPage === 'summary' ? '#ff5a5f' : '#f0f0f0',
            color: currentPage === 'summary' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          月度汇总
        </button>
        
        <button 
          onClick={() => setCurrentPage('details')} 
          style={{
            padding: '10px 20px',
            backgroundColor: currentPage === 'details' ? '#ff5a5f' : '#f0f0f0',
            color: currentPage === 'details' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          预订明细分析
        </button>
      </nav>
      
      <hr />

      {renderPage()}
    </div>
  );
}

export default App;