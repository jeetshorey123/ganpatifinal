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



  return (
    <div>ExportData Component</div>
  );



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
          </select>

        </div>
      </div>
    </div>
  );



export default ExportData;
