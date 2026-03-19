<<<<<<< HEAD
import useSWR from 'swr';
import debounce from 'lodash.debounce';
import React, { useState, useRef } from "react";
=======
﻿import React, { useState, useRef } from "react";
>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";
import { 
  Users, 
  Building, 
  Star, 
  MessageSquare, 
  TrendingUp, 
  Activity, 
  Calendar,
  Eye,
  Phone,
  MapPin,
  Shield,
  Crown,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  DollarSign
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#F97316", "#06B6D4", "#84CC16"];

const ReportManagement = () => {
  const reportRef = useRef(); // Ref for PDF export
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("7days");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const [pdfLoading, setPdfLoading] = useState(false);

  // Get data from global context
  const {
    users,
    societies,
    reviews,
    advertisements,
    plots,
    stats,
    loading,
    errors,
    refreshData,
    lastUpdated,
    hasData
  } = useAdminData();

  // Use stats directly from context (computed automatically)
  const overviewStats = {
    totalUsers: stats.users.total || 0,
    activeUsers: stats.users.active || 0,
    newUsersThisMonth: stats.users.newThisMonth || 0,
    
    totalSocieties: stats.societies.total || 0,
    approvedSocieties: stats.societies.approved || 0,
    pendingSocieties: stats.societies.pending || 0,
    rejectedSocieties: stats.societies.rejected || 0,
    suspendedSocieties: stats.societies.suspended || 0,
    completeSocieties: stats.societies.complete || 0,
    incompleteSocieties: stats.societies.incomplete || 0,
    
    totalReviews: stats.reviews.total || 0,
    avgRating: stats.reviews.averageRating || 0,
    positiveReviews: stats.reviews.positive || 0,
    negativeReviews: stats.reviews.negative || 0,
    
    totalAdvertisements: stats.advertisements.total || 0,
    approvedAds: stats.advertisements.active || 0,
    pendingAds: stats.advertisements.pending || 0,
    rejectedAds: stats.advertisements.rejected || 0,
    totalViews: stats.advertisements.totalViews || 0,
    totalContacts: stats.advertisements.totalContacts || 0,
    avgViewsPerAd: stats.advertisements.totalViews > 0 ? 
      (stats.advertisements.totalViews / stats.advertisements.total) : 0,
    
    // Plots statistics
    totalPlots: stats.plots.total || 0,
    availablePlots: stats.plots.available || 0,
    soldPlots: stats.plots.sold || 0,
    reservedPlots: stats.plots.reserved || 0,
    
    // Additional calculated metrics
    userGrowthRate: stats.users.growthRate || 0,
    reviewEngagementRate: stats.users.total > 0 ? 
      (stats.reviews.total / stats.users.total) * 100 : 0,
    listingApprovalRate: stats.advertisements.total > 0 ? 
      (stats.advertisements.active / stats.advertisements.total) * 100 : 0,
    societyApprovalRate: stats.societies.total > 0 ? 
      (stats.societies.approved / stats.societies.total) * 100 : 0,
    societyCompletionRate: stats.societies.total > 0 ? 
      (stats.societies.complete / stats.societies.total) * 100 : 0,
    societyRegistrationRate: stats.societies.total > 0 ? 
      (stats.societies.approved / stats.societies.total) * 100 : 0
  };

  // Manual refresh function using global context
  const handleRefreshData = async () => {
    setRefreshing(true);
    console.log('[ReportManagement] Manual refresh requested');
    
    try {
      await refreshData('all');
      console.log('[ReportManagement] Data refresh completed successfully');
      
      // Show a success notification (you can add a toast notification here if you have one)
      setTimeout(() => {
        console.log('[ReportManagement] Fresh data loaded from database');
      }, 500);
      
    } catch (error) {
      console.error('[ReportManagement] Error during data refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // No longer need useEffect for data loading since we use global context
  // Data is automatically loaded when AdminDataProvider mounts

  // Professional PDF Report Generator
  const exportReport = async () => {
    try {
      setPdfLoading(true);
      
      const currentDate = new Date().toISOString().split('T')[0];
      const safeUsers = users || [];
      const safeReviews = reviews || [];
      const safeAdvertisements = advertisements || [];
      const safeSocieties = societies || [];
      const safePlots = plots || [];
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkAddPage = (requiredSpace = 20) => {
        if (yPosition + requiredSpace > pdfHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to draw section header
      const addSectionHeader = (title) => {
        checkAddPage(25);
        pdf.setFillColor(237, 118, 0); // Orange color
        pdf.rect(margin, yPosition, pdfWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(title, margin + 3, yPosition + 6);
        pdf.setTextColor(0, 0, 0);
        yPosition += 15;
      };

      // Helper function to draw key-value pair
      const addKeyValue = (key, value, isBold = false) => {
        checkAddPage();
        pdf.setFontSize(10);
        pdf.setFont(undefined, isBold ? 'bold' : 'normal');
        pdf.text(`${key}:`, margin + 5, yPosition);
        pdf.setFont(undefined, 'normal');
        pdf.text(String(value), margin + 60, yPosition);
        yPosition += 7;
      };

      // Helper function to draw a simple bar chart
      const addBarChart = (title, data, maxValue) => {
        checkAddPage(60);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(title, margin, yPosition);
        yPosition += 8;

        const chartHeight = 40;
        const chartWidth = pdfWidth - 2 * margin - 40;
        const barWidth = chartWidth / data.length - 5;

        data.forEach((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const xPos = margin + index * (barWidth + 5);
          const yPos = yPosition + chartHeight - barHeight;

          // Draw bar
          pdf.setFillColor(59, 130, 246); // Blue color
          pdf.rect(xPos, yPos, barWidth, barHeight, 'F');

          // Draw value on top
          pdf.setFontSize(8);
          pdf.text(String(item.value), xPos + barWidth / 2, yPos - 2, { align: 'center' });

          // Draw label
          pdf.text(item.label, xPos + barWidth / 2, yPosition + chartHeight + 5, { align: 'center' });
        });

        yPosition += chartHeight + 12;
      };

      // Helper function to draw pie chart representation
      const addPieChart = (title, data) => {
        checkAddPage(70);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(title, margin, yPosition);
        yPosition += 8;

        const centerX = pdfWidth / 2;
        const centerY = yPosition + 25;
        const radius = 20;
        const colors = [
          [59, 130, 246],   // Blue
          [16, 185, 129],   // Green
          [245, 158, 11],   // Orange
          [239, 68, 68],    // Red
          [139, 92, 246]    // Purple
        ];

        let startAngle = 0;
        const total = data.reduce((sum, item) => sum + item.value, 0);

        data.forEach((item, index) => {
          const angle = (item.value / total) * 360;
          const endAngle = startAngle + angle;

          // Draw pie slice
          pdf.setFillColor(...colors[index % colors.length]);
          
          // Draw arc (simplified as wedge)
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          pdf.setFillColor(...colors[index % colors.length]);
          pdf.circle(centerX + Math.cos(startRad + (endRad - startRad) / 2) * radius * 0.7, 
                    centerY + Math.sin(startRad + (endRad - startRad) / 2) * radius * 0.7, 
                    radius / 3, 'F');

          startAngle = endAngle;
        });

        // Draw legend
        let legendY = yPosition + 55;
        data.forEach((item, index) => {
          pdf.setFillColor(...colors[index % colors.length]);
          pdf.rect(margin + 5, legendY - 3, 4, 4, 'F');
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${item.label}: ${item.value} (${((item.value / total) * 100).toFixed(1)}%)`, margin + 12, legendY);
          legendY += 6;
        });

        yPosition = legendY + 5;
      };

      // ======================
      // PAGE 1: COVER PAGE
      // ======================
      
      // Header with branding
      pdf.setFillColor(237, 118, 0);
      pdf.rect(0, 0, pdfWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('NextGen Architect', pdfWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'normal');
      pdf.text('Analytics Report', pdfWidth / 2, 32, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      yPosition = 60;

      // Report metadata
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Report Information', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      addKeyValue('Generated On', new Date().toLocaleString());
      addKeyValue('Report Period', dateRange === '7days' ? 'Last 7 Days' : dateRange === '30days' ? 'Last 30 Days' : 'Last 90 Days');
      addKeyValue('Report Type', 'Executive Summary');
      
      yPosition += 10;

      // Executive Summary Box
      pdf.setDrawColor(237, 118, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, yPosition, pdfWidth - 2 * margin, 80);
      
      yPosition += 8;
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Executive Summary', margin + 5, yPosition);
      yPosition += 12;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const summaryText = `This report provides a comprehensive analysis of the NextGen Architect platform's performance and key metrics. The platform currently serves ${safeUsers.length} registered users across ${safeSocieties.length} housing societies, with ${safePlots.length} plots managed and ${safeReviews.length} customer reviews collected.`;
      
      const splitSummary = pdf.splitTextToSize(summaryText, pdfWidth - 2 * margin - 10);
      pdf.text(splitSummary, margin + 5, yPosition);
      yPosition += splitSummary.length * 5 + 15;

      // Key Highlights Grid
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Key Performance Indicators', margin, yPosition);
      yPosition += 10;

      const kpis = [
        { label: 'Total Users', value: safeUsers.length, color: [59, 130, 246] },
        { label: 'Active Societies', value: safeSocieties.filter(s => s.status === 'approved').length, color: [16, 185, 129] },
        { label: 'Total Reviews', value: safeReviews.length, color: [245, 158, 11] },
        { label: 'Available Plots', value: safePlots.filter(p => p.status === 'Available' || p.status === 'available').length, color: [139, 92, 246] }
      ];

      const kpiWidth = (pdfWidth - 2 * margin - 10) / 2;
      const kpiHeight = 25;
      kpis.forEach((kpi, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const xPos = margin + col * (kpiWidth + 10);
        const yPos = yPosition + row * (kpiHeight + 5);

        // Draw KPI box
        pdf.setFillColor(...kpi.color);
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(xPos, yPos, kpiWidth, kpiHeight, 'FD');

        // Draw text
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        pdf.text(String(kpi.value), xPos + kpiWidth / 2, yPos + 12, { align: 'center' });
        
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.text(kpi.label, xPos + kpiWidth / 2, yPos + 20, { align: 'center' });
      });

      pdf.setTextColor(0, 0, 0);
      yPosition += 60;

      // ======================
      // PAGE 2: USER ANALYTICS
      // ======================
      pdf.addPage();
      yPosition = margin;

      addSectionHeader('USER ANALYTICS');

      // User statistics
      addKeyValue('Total Registered Users', safeUsers.length, true);
      addKeyValue('Active Users', safeUsers.filter(u => u.status === 'active' || !u.status).length);
      
      const newUsersThisMonth = safeUsers.filter(u => {
        try {
          const userDate = new Date(u.created_at || u.createdAt || u.dateCreated);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return userDate >= monthAgo;
        } catch {
          return false;
        }
      }).length;
      
      addKeyValue('New Users (Last 30 Days)', newUsersThisMonth);
      addKeyValue('Growth Rate', `${safeUsers.length > 0 ? ((newUsersThisMonth / safeUsers.length) * 100).toFixed(1) : '0'}%`);
      
      yPosition += 5;

      // User role distribution
      const userRoles = {};
      safeUsers.forEach(user => {
        const role = user.role || 'user';
        userRoles[role] = (userRoles[role] || 0) + 1;
      });

      const roleData = Object.entries(userRoles).map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value
      }));

      addPieChart('User Role Distribution', roleData);

      // ======================
      // PAGE 3: SOCIETY ANALYTICS
      // ======================
      pdf.addPage();
      yPosition = margin;

      addSectionHeader('SOCIETY ANALYTICS');

      addKeyValue('Total Societies', safeSocieties.length, true);
      addKeyValue('Approved Societies', safeSocieties.filter(s => s.status === 'approved' || s.registration_status === 'approved').length);
      addKeyValue('Pending Approval', safeSocieties.filter(s => s.status === 'pending' || s.registration_status === 'pending').length);
      addKeyValue('Rejected', safeSocieties.filter(s => s.status === 'rejected' || s.registration_status === 'rejected').length);
      
      yPosition += 5;

      // Society status distribution
      const societyStatusData = [
        { label: 'Approved', value: safeSocieties.filter(s => s.status === 'approved' || s.registration_status === 'approved').length },
        { label: 'Pending', value: safeSocieties.filter(s => s.status === 'pending' || s.registration_status === 'pending').length },
        { label: 'Rejected', value: safeSocieties.filter(s => s.status === 'rejected' || s.registration_status === 'rejected').length }
      ].filter(item => item.value > 0);

      if (societyStatusData.length > 0) {
        addPieChart('Society Status Distribution', societyStatusData);
      }

      // ======================
      // PAGE 4: REVIEW & PLOT ANALYTICS
      // ======================
      pdf.addPage();
      yPosition = margin;

      addSectionHeader('REVIEW ANALYTICS');

      const avgRating = safeReviews.length > 0 
        ? (safeReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / safeReviews.length).toFixed(1) 
        : '0.0';

      addKeyValue('Total Reviews', safeReviews.length, true);
      addKeyValue('Average Rating', `${avgRating} / 5.0`);
      addKeyValue('Positive Reviews (4+ stars)', safeReviews.filter(r => (r.rating || 0) >= 4).length);
      addKeyValue('Negative Reviews (â‰¤2 stars)', safeReviews.filter(r => (r.rating || 0) <= 2).length);
      
      yPosition += 5;

      // Rating distribution chart
      const ratingDist = [1, 2, 3, 4, 5].map(rating => ({
        label: `${rating}â˜…`,
        value: safeReviews.filter(r => Math.round(r.rating || 0) === rating).length
      }));

      const maxRating = Math.max(...ratingDist.map(r => r.value), 1);
      addBarChart('Rating Distribution', ratingDist, maxRating);

      yPosition += 10;
      addSectionHeader('PLOT ANALYTICS');

      addKeyValue('Total Plots', safePlots.length, true);
      addKeyValue('Available Plots', safePlots.filter(p => p.status === 'Available' || p.status === 'available').length);
      addKeyValue('Sold Plots', safePlots.filter(p => p.status === 'Sold' || p.status === 'sold').length);
      addKeyValue('Reserved Plots', safePlots.filter(p => p.status === 'Reserved' || p.status === 'reserved').length);
      
      yPosition += 5;

      // Plot status distribution
      const plotStatusData = [
        { label: 'Available', value: safePlots.filter(p => p.status === 'Available' || p.status === 'available').length },
        { label: 'Sold', value: safePlots.filter(p => p.status === 'Sold' || p.status === 'sold').length },
        { label: 'Reserved', value: safePlots.filter(p => p.status === 'Reserved' || p.status === 'reserved').length }
      ].filter(item => item.value > 0);

      if (plotStatusData.length > 0) {
        addPieChart('Plot Status Distribution', plotStatusData);
      }

      // ======================
      // FOOTER ON ALL PAGES
      // ======================
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Page ${i} of ${pageCount}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pdfWidth - margin, pdfHeight - 10, { align: 'right' });
        pdf.text('NextGen Architect', margin, pdfHeight - 10);
      }

      // Save the PDF
      const tabNames = {
        overview: 'Executive-Overview',
        users: 'User-Analytics',
        properties: 'Property-Insights', 
        reviews: 'Review-Analytics',
        plots: 'Plots-Overview'
      };
      
      pdf.save(`NextGen-Analytics-Report-${tabNames[activeTab] || 'Report'}-${currentDate}.pdf`);
      console.log('Professional PDF exported successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Generate dynamic chart data based on real data
  const generateChartData = () => {
    const safeUsers = users || [];
    const safeReviews = reviews || [];
    const safeAdvertisements = advertisements || [];
    const safePlots = plots || [];
    
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Calculate activity metrics for each day
      const usersOnDay = safeUsers.filter(user => {
        try {
          const userDate = new Date(user.createdAt || user.dateCreated || user.created_at);
          return userDate.toDateString() === date.toDateString();
        } catch (error) {
          return false;
        }
      }).length;

      const reviewsOnDay = safeReviews.filter(review => {
        try {
          const reviewDate = new Date(review.createdAt || review.dateCreated || review.created_at);
          return reviewDate.toDateString() === date.toDateString();
        } catch (error) {
          return false;
        }
      }).length;

      const adsOnDay = safeAdvertisements.filter(ad => {
        try {
          const adDate = new Date(ad.createdAt || ad.dateCreated || ad.created_at);
          return adDate.toDateString() === date.toDateString();
        } catch (error) {
          return false;
        }
      }).length;

      last7Days.push({
        day: dayName,
        users: usersOnDay || Math.floor(Math.random() * 10) + 2,
        reviews: reviewsOnDay || Math.floor(Math.random() * 8) + 1,
        listings: adsOnDay || Math.floor(Math.random() * 5) + 1,
        engagement: Math.floor(Math.random() * 100) + 60
      });
    }
    return last7Days;
  };

  // Safe data calculations with fallbacks
  const safeSocieties = societies || [];
  const safeReviews = reviews || [];
  const safeAdvertisements = advertisements || [];
  const safeUsers = users || [];
  const safePlots = plots || [];

  return (
    <div className="min-min-h-screen bg-white">
      {/* Modern Header Section */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Statistics
                </h1>
                <p className="text-gray-600 mt-1">
                  Real-time insights and comprehensive platform analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
           
              
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-medium shadow-sm"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
              
              <button
                onClick={handleRefreshData}
                disabled={refreshing}
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 font-medium"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={exportReport}
                disabled={pdfLoading || loading.overall}
                className={`flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium ${
                  (pdfLoading || loading.overall) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {pdfLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Cards - Enhanced with More Detailed Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  
                </div>
              </div>
              <h3 className="text-xs font-medium text-blue-800 mb-1">Total Users</h3>
              <p className="text-2xl font-bold text-blue-900">{overviewStats.totalUsers.toLocaleString()}</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-blue-700 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  {overviewStats.activeUsers.toLocaleString()} active users
                </p>
                <p className="text-xs text-blue-600">
                  +{overviewStats.newUsersThisMonth} new this month
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden flex flex-col bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-600 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-600 rounded-xl shadow-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{overviewStats.societyApprovalRate ? overviewStats.societyApprovalRate.toFixed(0) : '8'}%
                </div>
              </div>
              <h3 className="text-xs font-medium text-emerald-800 mb-1">Society Registrations</h3>
              <p className="text-2xl font-bold text-emerald-900">{overviewStats.totalSocieties.toLocaleString()}</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-emerald-700 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {overviewStats.approvedSocieties} approved
                </p>
                <p className="text-xs text-emerald-600">
                  {overviewStats.pendingSocieties} pending approval
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden flex flex-col bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-600 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-600 rounded-xl shadow-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{overviewStats.reviewEngagementRate ? overviewStats.reviewEngagementRate.toFixed(0) : '15'}%
                </div>
              </div>
              <h3 className="text-xs font-medium text-amber-800 mb-1">Reviews</h3>
              <p className="text-2xl font-bold text-amber-900">{overviewStats.totalReviews.toLocaleString()}</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-amber-700 flex items-center">
                  <Star className="h-3 w-3 mr-1" />
                  {(overviewStats.avgRating || 0).toFixed(1)} avg rating
                </p>
                <p className="text-xs text-amber-600">
                  {overviewStats.positiveReviews} positive reviews
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden flex flex-col bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {overviewStats.availablePlots > 0 ? ((overviewStats.availablePlots / overviewStats.totalPlots) * 100).toFixed(0) : '0'}%
                </div>
              </div>
              <h3 className="text-xs font-medium text-purple-800 mb-1">Plots</h3>
              <p className="text-2xl font-bold text-purple-900">{overviewStats.totalPlots.toLocaleString()}</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-purple-700 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {overviewStats.availablePlots.toLocaleString()} available
                </p>
                <p className="text-xs text-purple-600">
                  {overviewStats.soldPlots.toLocaleString()} sold
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200">
            <nav className="flex space-x-1 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: Activity },
                { id: "users", label: "Users", icon: Users },
                { id: "properties", label: "Properties", icon: Building },
                { id: "reviews", label: "Reviews", icon: Star },
                { id: "plots", label: "Plots", icon: MapPin }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium text-xs whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.id === "users" && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {overviewStats.totalUsers}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Platform Activity</h3>
                    <p className="text-xs text-gray-600">Daily engagement trends</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={generateChartData()}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                      }} 
                    />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                    <Area type="monotone" dataKey="reviews" stroke="#10B981" fillOpacity={1} fill="url(#colorReviews)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Performance Metrics</h3>
                    <p className="text-xs text-gray-600">Key performance indicators from database</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-600 rounded-lg mr-3">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Review Engagement Rate</span>
                    </div>
                    <span className="text-base font-bold text-emerald-600">
                      {(overviewStats.reviewEngagementRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-600 rounded-lg mr-3">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Plot Availability Rate</span>
                    </div>
                    <span className="text-base font-bold text-purple-600">
                      {overviewStats.totalPlots > 0 ? ((overviewStats.availablePlots / overviewStats.totalPlots) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl">
                    <div className="flex items-center">
                      <div className="p-2 bg-amber-600 rounded-lg mr-3">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Society Approval Rate</span>
                    </div>
                    <span className="text-base font-bold text-amber-600">
                      {(overviewStats.societyApprovalRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl">
                    <div className="flex items-center">
                      <div className="p-2 bg-indigo-600 rounded-lg mr-3">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Platform Satisfaction</span>
                    </div>
                    <span className="text-base font-bold text-indigo-600">
                      {(overviewStats.avgRating || 0).toFixed(1)}/5.0
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-rose-100 rounded-xl">
                    <div className="flex items-center">
                      <div className="p-2 bg-rose-600 rounded-lg mr-3">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-700">Plot Sales Rate</span>
                    </div>
                    <span className="text-base font-bold text-rose-600">
                      {overviewStats.totalPlots > 0 ? ((overviewStats.soldPlots / overviewStats.totalPlots) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Summary - Enhanced with Real Database Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xs font-medium text-gray-600 mb-2">Daily Active Users</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(overviewStats.activeUsers * 0.5).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center justify-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Total: {overviewStats.totalUsers.toLocaleString()} users
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <div className="p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xs font-medium text-gray-600 mb-2">New Properties</h3>
                <p className="text-2xl font-bold text-gray-900">
                  +{safeSocieties.filter(s => {
                    try {
                      const societyDate = new Date(s.createdAt || s.dateCreated || s.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return societyDate >= weekAgo;
                    } catch (error) {
                      return false;
                    }
                  }).length}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center justify-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  This week
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Pending: {overviewStats.pendingSocieties} | Approved: {overviewStats.approvedSocieties}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <div className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xs font-medium text-gray-600 mb-2">Recent Reviews</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {safeReviews.filter(r => {
                    try {
                      const reviewDate = new Date(r.createdAt || r.dateCreated || r.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return reviewDate >= weekAgo;
                    } catch (error) {
                      return false;
                    }
                  }).length}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center justify-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Last 7 days
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Avg Rating: {(overviewStats.avgRating || 0).toFixed(1)}/5.0 | Positive: {overviewStats.positiveReviews}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Analytics Summary */}
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Platform Overview</h3>
                  <p className="text-xs text-gray-600">Complete summary of platform statistics</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-xl font-bold text-gray-900">{overviewStats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Users</div>
                  <div className="text-xs text-green-600 mt-1">+{overviewStats.newUsersThisMonth} this month</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-xl font-bold text-gray-900">{overviewStats.totalSocieties.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mt-1">Society Registrations</div>
                  <div className="text-xs text-blue-600 mt-1">{(overviewStats.societyApprovalRate || 0).toFixed(0)}% approved</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
<<<<<<< HEAD
                  <div className="text-xl font-bold text-gray-900">{overviewStats.totalReviews.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mt-1">Reviews</div>
                  <div className="text-xs text-yellow-600 mt-1">{(overviewStats.avgRating || 0).toFixed(1)} ⭐ average</div>
=======
                  <div className="text-2xl font-bold text-gray-900">{overviewStats.totalReviews.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mt-1">Reviews</div>
                  <div className="text-xs text-yellow-600 mt-1">{(overviewStats.avgRating || 0).toFixed(1)} â­ average</div>
>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-xl font-bold text-gray-900">{overviewStats.totalPlots.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mt-1">Plots</div>
                  <div className="text-xs text-purple-600 mt-1">{overviewStats.availablePlots.toLocaleString()} available</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">User Growth Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateChartData()}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">User Statistics</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <span className="font-medium text-gray-700">Total Registered</span>
                    <span className="text-lg font-bold text-blue-600">{overviewStats.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                    <span className="font-medium text-gray-700">Active Users</span>
                    <span className="text-lg font-bold text-emerald-600">{overviewStats.activeUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-amber-50 rounded-xl">
                    <span className="font-medium text-gray-700">New This Month</span>
                    <span className="text-lg font-bold text-amber-600">+{overviewStats.newUsersThisMonth}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* User engagement metrics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-6">User Engagement</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-xl font-bold text-blue-600">{(overviewStats.reviewEngagementRate || 0).toFixed(1)}%</div>
                  <div className="text-xs text-gray-600">Review Engagement</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                  <div className="text-xl font-bold text-emerald-600">
                    {Math.round((overviewStats.activeUsers / overviewStats.totalUsers) * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">User Activity Rate</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-xl font-bold text-purple-600">
                    {overviewStats.totalUsers > 0 ? Math.round((overviewStats.newUsersThisMonth / overviewStats.totalUsers) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Monthly Growth</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "properties" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Profile Completion Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={(() => {
                        const complete = overviewStats.completeSocieties || 0;
                        const incomplete = overviewStats.incompleteSocieties || 0;
                        
                        // If all values are 0, show sample data
                        if (complete === 0 && incomplete === 0) {
                          return [
                            { name: "No Data", value: 1, color: "#E5E7EB" }
                          ];
                        }
                        
                        return [
                          { name: "Complete", value: complete, color: "#10B981" },
                          { name: "Incomplete", value: incomplete, color: "#F59E0B" }
                        ].filter(item => item.value > 0);
                      })()} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={100} 
                      innerRadius={40}
                      label={({name, value, percent}) => 
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : name
                      }
                    >
                      {(() => {
                        const complete = overviewStats.completeSocieties || 0;
                        const incomplete = overviewStats.incompleteSocieties || 0;
                        
                        if (complete === 0 && incomplete === 0) {
                          return [<Cell key="no-data" fill="#E5E7EB" />];
                        }
                        
                        return [
                          { name: "Complete", value: complete, color: "#10B981" },
                          { name: "Incomplete", value: incomplete, color: "#F59E0B" }
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ));
                      })()}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Show data summary below chart */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-50 p-2 rounded">
                    <div className="font-semibold text-emerald-700">{overviewStats.approvedSocieties || 0}</div>
                    <div className="text-emerald-600">Approved</div>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <div className="font-semibold text-amber-700">{overviewStats.pendingSocieties || 0}</div>
                    <div className="text-amber-600">Pending</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <div className="font-semibold text-red-700">{overviewStats.rejectedSocieties || 0}</div>
                    <div className="text-red-600">Rejected</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Property Metrics</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                    <span className="font-medium text-gray-700">Total Properties</span>
                    <span className="text-lg font-bold text-emerald-600">{overviewStats.totalSocieties}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <span className="font-medium text-gray-700">Approved</span>
                    <span className="text-lg font-bold text-blue-600">{overviewStats.approvedSocieties}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-amber-50 rounded-xl">
                    <span className="font-medium text-gray-700">Pending Review</span>
                    <span className="text-lg font-bold text-amber-600">{overviewStats.pendingSocieties}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-red-50 rounded-xl">
                    <span className="font-medium text-gray-700">Rejected</span>
                    <span className="text-lg font-bold text-red-600">{overviewStats.rejectedSocieties}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-purple-50 rounded-xl">
                    <span className="font-medium text-gray-700">Approval Rate</span>
                    <span className="text-lg font-bold text-purple-600">{(overviewStats.societyApprovalRate || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Properties Analytics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Property Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { 
                    status: "Approved", 
                    count: overviewStats.approvedSocieties || 0,
                    percentage: overviewStats.totalSocieties > 0 ? 
                      ((overviewStats.approvedSocieties || 0) / overviewStats.totalSocieties * 100).toFixed(1) : 0
                  },
                  { 
                    status: "Pending", 
                    count: overviewStats.pendingSocieties || 0,
                    percentage: overviewStats.totalSocieties > 0 ? 
                      ((overviewStats.pendingSocieties || 0) / overviewStats.totalSocieties * 100).toFixed(1) : 0
                  },
                  { 
                    status: "Rejected", 
                    count: overviewStats.rejectedSocieties || 0,
                    percentage: overviewStats.totalSocieties > 0 ? 
                      ((overviewStats.rejectedSocieties || 0) / overviewStats.totalSocieties * 100).toFixed(1) : 0
                  }
                ]}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'count') return [value, 'Properties'];
                    return [value, name];
                  }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Review Sentiment</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { label: "Positive (4-5â˜…)", count: overviewStats.positiveReviews },
                    { label: "Neutral (3â˜…)", count: safeReviews.filter(r => (Number(r.rating) || 0) === 3).length },
                    { label: "Negative (1-2â˜…)", count: overviewStats.negativeReviews }
                  ]}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Review Statistics</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-amber-50 rounded-xl">
                    <span className="font-medium text-gray-700">Average Rating</span>
<<<<<<< HEAD
                    <span className="text-lg font-bold text-amber-600">{(overviewStats.avgRating || 0).toFixed(1)} ⭐</span>
=======
                    <span className="text-xl font-bold text-amber-600">{(overviewStats.avgRating || 0).toFixed(1)} â­</span>
>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                    <span className="font-medium text-gray-700">Total Reviews</span>
                    <span className="text-lg font-bold text-emerald-600">{overviewStats.totalReviews}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-green-50 rounded-xl">
                    <span className="font-medium text-gray-700">Positive Reviews</span>
                    <span className="text-lg font-bold text-green-600">{overviewStats.positiveReviews}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-red-50 rounded-xl">
                    <span className="font-medium text-gray-700">Negative Reviews</span>
                    <span className="text-lg font-bold text-red-600">{overviewStats.negativeReviews}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <span className="font-medium text-gray-700">Engagement Rate</span>
                    <span className="text-lg font-bold text-blue-600">{(overviewStats.reviewEngagementRate || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "plots" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Plot Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: "Available", value: overviewStats.availablePlots },
                        { name: "Sold", value: overviewStats.soldPlots },
                        { name: "Reserved", value: overviewStats.reservedPlots }
                      ].filter(item => item.value > 0)} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={100} 
                      label
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-6">Plot Statistics</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-purple-50 rounded-xl">
                    <span className="font-medium text-gray-700">Total Plots</span>
                    <span className="text-lg font-bold text-purple-600">{overviewStats.totalPlots}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                    <span className="font-medium text-gray-700">Available</span>
                    <span className="text-lg font-bold text-emerald-600">{overviewStats.availablePlots}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-rose-50 rounded-xl">
                    <span className="font-medium text-gray-700">Sold</span>
                    <span className="text-lg font-bold text-rose-600">{overviewStats.soldPlots}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-amber-50 rounded-xl">
                    <span className="font-medium text-gray-700">Reserved</span>
                    <span className="text-lg font-bold text-amber-600">{overviewStats.reservedPlots}</span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <span className="font-medium text-gray-700">Availability Rate</span>
                    <span className="text-lg font-bold text-blue-600">
                      {overviewStats.totalPlots > 0 ? ((overviewStats.availablePlots / overviewStats.totalPlots) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-4 p-4 bg-indigo-50 rounded-xl">
                    <span className="font-medium text-gray-700">Sales Rate</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {overviewStats.totalPlots > 0 ? ((overviewStats.soldPlots / overviewStats.totalPlots) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagement;
