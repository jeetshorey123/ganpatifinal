import React, { useState, useEffect } from 'react';
import { donationService } from './supabaseClient';
import './ExportData.css';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
      setLoginError('');
      fetchData(); // Fetch data after successful login
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
    setLoginError('');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFilteredCount = () => {
    let filteredData = donations;
    
    // Apply building filter
    if (buildingFilter !== 'all') {
      filteredData = filteredData.filter(d => d.building === buildingFilter);
    }
    
    // Apply payment status filter
    if (paymentStatusFilter !== 'all') {
      if (paymentStatusFilter === 'partial') {
        filteredData = filteredData.filter(d => d.payment_status === 'Pending');
      } else if (paymentStatusFilter === 'completed') {
        filteredData = filteredData.filter(d => d.payment_status === 'Completed');
      }
    }
    
    return filteredData.length;
  };

  const formatForGoogleSheets = (data, format) => {
    if (!data || data.length === 0) return '';

    let filteredData = data;
    
    // Apply building filter
    if (buildingFilter !== 'all') {
      filteredData = filteredData.filter(d => d.building === buildingFilter);
    }
    
    // Apply payment status filter
    if (paymentStatusFilter !== 'all') {
      if (paymentStatusFilter === 'partial') {
        filteredData = filteredData.filter(d => d.payment_status === 'Pending');
      } else if (paymentStatusFilter === 'completed') {
        filteredData = filteredData.filter(d => d.payment_status === 'Completed');
      }
    }

    switch (format) {
      case 'detailed':
        return formatDetailed(filteredData);
      case 'summary':
        return formatSummary(filteredData);
      case 'building-wise':
        return formatBuildingWise(filteredData);
      case 'wing-wise':
        return formatWingWise(filteredData);
      case 'partial-payments':
        return formatPartialPayments(filteredData);
      default:
        return formatDetailed(filteredData);
    }
  };

  const formatDetailed = (data) => {
    const headers = [
      'Building', 'Wing', 'Flat No', 'Donor Name', 'Phone Number', 'Email', 'Resident Type',
      'Payment Method', 'Status', 'Total Amount (₹)', 'Amount Paid (₹)', 
      'Balance (₹)', 'Date & Time', 'Receipt PDF'
    ];
  function getStatistics() {
    const rows = data.map(d => [
      d.building || '',
      d.wing || '',
      d.flat || '',
      d.name || '',
      d.phone || '',
      d.email || '',
      d.resident_type || '',
      d.payment_method || '',
      d.payment_status || '',
      d.total_amount || 0,
      d.amount_paid || 0,
      d.balance_amount || 0,
      d.created_at ? new Date(d.created_at).toLocaleString() : '',
      d.receipt_url || 'Not Generated'
    ]);

    return [headers, ...rows].map(row => row.join('\t')).join('\n');
  };

  const formatSummary = (data) => {
    const summary = {
      totalDonations: data.length,
      totalCollected: data.reduce((sum, d) => sum + (d.amount_paid || 0), 0),
      fullPayments: data.filter(d => d.payment_status === 'Completed').length,
      partialPayments: data.filter(d => d.payment_status === 'Pending').length,
      pendingAmount: data.reduce((sum, d) => {
        return sum + (d.payment_status === 'Pending' ? (d.total_amount || 0) - (d.amount_paid || 0) : 0);
      }, 0)
    };

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Donations', summary.totalDonations],
      ['Total Collected (₹)', summary.totalCollected.toFixed(2)],
      ['Full Payments', summary.fullPayments],
      ['Partial Payments', summary.partialPayments],
      ['Pending Amount (₹)', summary.pendingAmount.toFixed(2)]
    ];

    return [headers, ...rows].map(row => row.join('\t')).join('\n');
  };

  const formatBuildingWise = (data) => {
    const buildingStats = {};
    
    data.forEach(d => {
      if (!buildingStats[d.building]) {
        buildingStats[d.building] = {
          totalDonations: 0,
          totalCollected: 0,
          fullPayments: 0,
          partialPayments: 0,
          pendingAmount: 0
        };
      }
      
      const stats = buildingStats[d.building];
      stats.totalDonations++;
      stats.totalCollected += d.amount_paid || 0;
      if (d.payment_status === 'Completed') stats.fullPayments++;
      if (d.payment_status === 'Pending') {
        stats.partialPayments++;
        stats.pendingAmount += (d.total_amount || 0) - (d.amount_paid || 0);
      }
    });

    const headers = [
      'Building', 'Total Donations', 'Total Collected (₹)', 
      'Full Payments', 'Partial Payments', 'Pending Amount (₹)'
    ];
    
    const rows = Object.entries(buildingStats).map(([building, stats]) => [
      building,
      stats.totalDonations,
      stats.totalCollected.toFixed(2),
      stats.fullPayments,
      stats.partialPayments,
      stats.pendingAmount.toFixed(2)
    ]);

    return [headers, ...rows].map(row => row.join('\t')).join('\n');
  };

  const formatWingWise = (data) => {
    const wingStats = {};
    
    data.forEach(d => {
      const key = `${d.building} - ${d.wing}`;
      if (!wingStats[key]) {
        wingStats[key] = {
          building: d.building,
          wing: d.wing,
          totalDonations: 0,
          totalCollected: 0,
          fullPayments: 0,
          partialPayments: 0
        };
      }
      
      const stats = wingStats[key];
      stats.totalDonations++;
      stats.totalCollected += d.amount_paid || 0;
      if (d.payment_status === 'Completed') stats.fullPayments++;
      if (d.payment_status === 'Pending') stats.partialPayments++;
    });

    const headers = [
      'Building', 'Wing', 'Total Donations', 'Total Collected (₹)', 
      'Full Payments', 'Partial Payments'
    ];
    
    const rows = Object.values(wingStats).map(stats => [
      stats.building,
      stats.wing,
      stats.totalDonations,
      stats.totalCollected.toFixed(2),
      stats.fullPayments,
      stats.partialPayments
    ]);

    return [headers, ...rows].map(row => row.join('\t')).join('\n');
  };

  const formatPartialPayments = (data) => {
    // Filter for only partial payments
    const partialData = data.filter(d => d.payment_status === 'Pending');
    
    const headers = [
      'Building', 'Wing', 'Flat No', 'Donor Name', 'Phone Number', 'Email', 'Resident Type',
      'Total Amount (₹)', 'Amount Paid (₹)', 'Balance Due (₹)', 
      'Payment Method', 'Date & Time', 'Receipt PDF'
    ];
    
    const rows = partialData.map(d => [
      d.building || '',
      d.wing || '',
      d.flat || '',
      d.name || '',
      d.phone || '',
      d.email || '',
      d.resident_type || '',
      d.total_amount || 0,
      d.amount_paid || 0,
      ((d.total_amount || 0) - (d.amount_paid || 0)).toFixed(2),
      d.payment_method || '',
      d.created_at ? new Date(d.created_at).toLocaleString() : '',
      d.receipt_url || 'Not Generated'
    ]);

    // Add summary row at the end
    const totalDue = partialData.reduce((sum, d) => sum + ((d.total_amount || 0) - (d.amount_paid || 0)), 0);
    const totalPaid = partialData.reduce((sum, d) => sum + (d.amount_paid || 0), 0);
    const totalAmount = partialData.reduce((sum, d) => sum + (d.total_amount || 0), 0);
    
    const summaryRow = [
      'TOTAL', '', '', `${partialData.length} Donors`, '', '', '',
      totalAmount.toFixed(2), totalPaid.toFixed(2), totalDue.toFixed(2),
      '', '', ''
    ];

    return [headers, ...rows, summaryRow].map(row => row.join('\t')).join('\n');
  };

  const handleExport = () => {
    const formatted = formatForGoogleSheets(donations, selectedFormat);
    setExportData(formatted);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      alert('Data copied to clipboard! You can now paste it into Google Sheets.');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please select all text and copy manually.');
    }
  };

  const downloadCSV = () => {
    const csvData = exportData.replace(/\t/g, ',');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `donations_${selectedFormat}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data preparation function
  const prepareChartData = () => {
    // Filter donations based on selected filters
    let filteredData = [...donations];
    
    // Apply building filter
    if (buildingFilter !== 'all') {
      filteredData = filteredData.filter(d => d.building === buildingFilter);
    }
    
    // Apply payment status filter
    if (paymentStatusFilter !== 'all') {
      if (paymentStatusFilter === 'partial') {
        filteredData = filteredData.filter(d => d.payment_status === 'Pending');
      } else if (paymentStatusFilter === 'completed') {
        filteredData = filteredData.filter(d => d.payment_status === 'Completed');
      }
    }

    // Prepare payment status chart data (Pie chart)
    const completed = filteredData.filter(d => d.payment_status === 'Completed').length;
    const pending = filteredData.filter(d => d.payment_status === 'Pending').length;
    
    const paymentStatusData = {
      labels: ['Completed', 'Pending'],
      datasets: [
        {
          data: [completed, pending],
          backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1,
          hoverOffset: 4
        }
      ]
    };

    setChartData(prev => ({
      ...prev,
      paymentStatus: paymentStatusData
    }));

    // Prepare building distribution chart data (Bar chart)
    const buildingGroups = {};
    filteredData.forEach(d => {
      if (!buildingGroups[d.building]) buildingGroups[d.building] = 0;
      buildingGroups[d.building]++;
    });

    const buildingData = {
      labels: Object.keys(buildingGroups),
      datasets: [
        {
          label: 'Donations by Building',
          data: Object.values(buildingGroups),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          borderRadius: 5,
        }
      ]
    };

    setChartData(prev => ({
      ...prev,
      buildingDistribution: buildingData
    }));

    // Prepare timeline data (Line chart)
    // Group donations by date
    const timelineGroups = {};
    filteredData.forEach(d => {
      if (d.created_at) {
        const date = new Date(d.created_at).toLocaleDateString();
        if (!timelineGroups[date]) timelineGroups[date] = 0;
        timelineGroups[date] += d.amount_paid || 0;
      }
    });
    
    // Sort dates
    const sortedDates = Object.keys(timelineGroups).sort((a, b) => new Date(a) - new Date(b));
    
    const timelineData = {
      labels: sortedDates,
      datasets: [
        {
          label: 'Daily Donations (₹)',
          data: sortedDates.map(date => timelineGroups[date]),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(153, 102, 255, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(153, 102, 255, 1)',
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };

    setChartData(prev => ({
      ...prev,
      timelineData: timelineData
    }));

    // Prepare amount distribution chart data
    // Define amount ranges
    const ranges = [
      { min: 0, max: 1000, label: '0-1K' },
      { min: 1001, max: 5000, label: '1K-5K' },
      { min: 5001, max: 10000, label: '5K-10K' },
      { min: 10001, max: 25000, label: '10K-25K' },
      { min: 25001, max: Infinity, label: '25K+' }
    ];

    // Count donations in each range
    const amountCounts = ranges.map(range => ({
      ...range,
      count: filteredData.filter(d => 
        (d.total_amount >= range.min && d.total_amount <= range.max)
      ).length
    }));

    const amountDistributionData = {
      labels: amountCounts.map(r => r.label),
      datasets: [
        {
          label: 'Amount Distribution',
          data: amountCounts.map(r => r.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1,
          borderRadius: 5,
        }
      ]
    };

    setChartData({
      paymentStatus: paymentStatusData,
      buildingDistribution: buildingData,
      timelineData: timelineData,
      amountDistribution: amountDistributionData
    });
  };

  // Calculate key statistics
  const getStatistics = () => {
    let filteredData = [...donations];
    
    // Apply filters
    if (buildingFilter !== 'all') {
      filteredData = filteredData.filter(d => d.building === buildingFilter);
    }
    
    if (paymentStatusFilter !== 'all') {
      if (paymentStatusFilter === 'partial') {
        filteredData = filteredData.filter(d => d.payment_status === 'Pending');
      } else if (paymentStatusFilter === 'completed') {
        filteredData = filteredData.filter(d => d.payment_status === 'Completed');
      }
    }

    const totalDonations = filteredData.length;
    const totalAmount = filteredData.reduce((sum, d) => sum + (d.total_amount || 0), 0);
    const totalPaid = filteredData.reduce((sum, d) => sum + (d.amount_paid || 0), 0);
    const totalPending = filteredData.reduce((sum, d) => {
      return sum + (d.payment_status === 'Pending' ? (d.total_amount || 0) - (d.amount_paid || 0) : 0);
    }, 0);
    const completedPayments = filteredData.filter(d => d.payment_status === 'Completed').length;
    const partialPayments = filteredData.filter(d => d.payment_status === 'Pending').length;
    const completionRate = totalDonations > 0 ? (completedPayments / totalDonations * 100).toFixed(1) : 0;
    const averageDonation = totalDonations > 0 ? (totalAmount / totalDonations).toFixed(2) : 0;

    return {
      totalDonations,
      totalAmount,
      totalPaid,
      totalPending,
      completedPayments,
      partialPayments,
      completionRate,
      averageDonation
    };
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="login-container">
          <h2>🔐 Admin Login Required</h2>
          <p>Please login to access donation export data</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                required
                placeholder="Enter admin username"
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                placeholder="Enter admin password"
              />
            </div>
            
            {loginError && (
              <div className="error-message">
                ❌ {loginError}
              </div>
            )}
            
            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
          
          <div className="login-help">
            <p>💡 Contact administrator for access credentials</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="export-container">
        <div className="loading">Loading donation data...</div>
      </div>
    );
  }

  const statistics = getStatistics();

  return (
    <div className="export-container futuristic-export">
      <div className="export-header">
        <h2>📊 Advanced Analytics & Data Export</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)} 
            className="toggle-analytics-btn"
          >
            {showAnalytics ? '📈 Hide Analytics' : '📊 Show Analytics'}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="analytics-dashboard">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">₹{getStatistics().totalPaid.toLocaleString()}</div>
              <div className="stat-label">Total Collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{getStatistics().totalDonations}</div>
              <div className="stat-label">Total Donors</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{getStatistics().completionRate}%</div>
              <div className="stat-label">Completion Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">₹{getStatistics().averageDonation}</div>
              <div className="stat-label">Average Donation</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-value">₹{getStatistics().totalPending.toLocaleString()}</div>
              <div className="stat-label">Pending Amount</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-value">{buildings.length}</div>
              <div className="stat-label">Buildings</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Payment Status Distribution</h3>
              {chartData.paymentStatus && (
                <div className="chart-container">
                  <Pie 
                    data={chartData.paymentStatus} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: '#ffffff',
                            font: { size: 12 }
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3>Building-wise Distribution</h3>
              {chartData.buildingDistribution && (
                <div className="chart-container">
                  <Bar 
                    data={chartData.buildingDistribution} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      },
                      scales: {
                        y: {
                          ticks: { color: '#ffffff' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                          ticks: { color: '#ffffff' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="chart-card wide">
              <h3>Donation Timeline</h3>
              {chartData.timelineData && (
                <div className="chart-container">
                  <Line 
                    data={chartData.timelineData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      },
                      scales: {
                        y: {
                          ticks: { color: '#ffffff' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                          ticks: { color: '#ffffff' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3>Amount Distribution</h3>
              {chartData.amountDistribution && (
                <div className="chart-container">
                  <Bar 
                    data={chartData.amountDistribution} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#ffffff'
                          }
                        }
                      },
                      scales: {
                        y: {
                          ticks: { color: '#ffffff' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                          ticks: { color: '#ffffff' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="export-controls">
        <div className="control-group">
          <label>Export Format:</label>
          <select 
            value={selectedFormat} 
            onChange={(e) => setSelectedFormat(e.target.value)}
          >
            <option value="detailed">Detailed Donor Information</option>
            <option value="partial-payments">Partial Payments Report</option>
            <option value="summary">Summary Statistics</option>
            <option value="building-wise">Building-wise Summary</option>
            <option value="wing-wise">Wing-wise Summary</option>
          </select>
        </div>

        <div className="control-group">
          <label>Building Filter:</label>
          <select 
            value={buildingFilter} 
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="all">All Buildings</option>
            {buildings.map(building => (
              <option key={building} value={building}>{building}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Payment Status Filter:</label>
          <select 
            value={paymentStatusFilter} 
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="partial">Partial Payments Only</option>
            <option value="completed">Completed Payments Only</option>
          </select>
          {paymentStatusFilter === 'partial' && (
            <small className="filter-help">
              💡 Showing donors who have pending balance amounts
            </small>
          )}
        </div>

        <button onClick={handleExport} className="export-btn">
          📋 Generate Export Data
        </button>
      </div>

      {exportData && (
        <div className="export-result">
          <h3>📄 Export Data Ready</h3>
          <p>Total Records: {getFilteredCount()}</p>
          {paymentStatusFilter === 'partial' && (
            <p className="partial-summary">
              💰 Showing {getFilteredCount()} donors with pending balance amounts
            </p>
          )}
          
          <div className="export-actions">
            <button onClick={copyToClipboard} className="copy-btn">
              📋 Copy to Clipboard
            </button>
            <button onClick={downloadCSV} className="download-btn">
              💾 Download CSV
            </button>
          </div>

          <div className="export-preview">
            <h4>Preview (First 5 rows):</h4>
            <pre>{exportData.split('\n').slice(0, 6).join('\n')}</pre>
          </div>

          <div className="export-instructions">
            <h4>📝 How to use in Google Sheets:</h4>
            <ol>
              <li>Click "Copy to Clipboard" button above</li>
              <li>Open Google Sheets in your browser</li>
              <li>Create a new spreadsheet</li>
              <li>Click on cell A1</li>
              <li>Press Ctrl+V (or Cmd+V on Mac) to paste</li>
              <li>The data will automatically format into columns</li>
            </ol>
          </div>
        </div>
      )}

      {showAnalytics && donations.length > 0 && (
        <div className="analytics-section">
          <h3>📈 Donation Analytics</h3>
          
          <div className="chart-container">
            <div className="chart-card">
              <h4>Payment Status Distribution</h4>
              <Pie data={chartData.paymentStatus} />
            </div>

            <div className="chart-card">
              <h4>Building-wise Donation Distribution</h4>
              <Bar data={chartData.buildingDistribution} />
            </div>

            <div className="chart-card">
              <h4>Donations Over Time</h4>
              <Line data={chartData.timelineData} />
            </div>

            <div className="chart-card">
              <h4>Amount Distribution</h4>
              <Doughnut data={chartData.amountDistribution} />
            </div>
          </div>

          <button onClick={() => setShowAnalytics(false)} className="hide-analytics-btn">
            📉 Hide Analytics
          </button>
        </div>
      )}

      {donations.length > 0 && (
        <div className="statistics-summary">
          <h3>📊 Key Statistics</h3>
          <div className="statistics-grid">
            <div className="statistic-card">
              <h4>Total Donations</h4>
              <p className="statistic-value">{statistics.totalDonations}</p>
            </div>

            <div className="statistic-card">
              <h4>Total Amount (₹)</h4>
              <p className="statistic-value">{statistics.totalAmount.toFixed(2)}</p>
            </div>

            <div className="statistic-card">
              <h4>Total Paid (₹)</h4>
              <p className="statistic-value">{statistics.totalPaid.toFixed(2)}</p>
            </div>

            <div className="statistic-card">
              <h4>Total Pending (₹)</h4>
              <p className="statistic-value">{statistics.totalPending.toFixed(2)}</p>
            </div>

            <div className="statistic-card">
              <h4>Completed Payments</h4>
              <p className="statistic-value">{statistics.completedPayments}</p>
            </div>

            <div className="statistic-card">
              <h4>Partial Payments</h4>
              <p className="statistic-value">{statistics.partialPayments}</p>
            </div>

            <div className="statistic-card">
              <h4>Completion Rate</h4>
              <p className="statistic-value">{statistics.completionRate}%</p>
            </div>

            <div className="statistic-card">
              <h4>Average Donation (₹)</h4>
              <p className="statistic-value">{statistics.averageDonation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportData;
