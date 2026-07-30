
'use client';

import { useState, useEffect } from 'react';
import './analytics.css';

// --- Type Definitions ---
interface GaMetric { name: string; value: string; }
interface GaReportRow { dimensionValues: { value: string }[]; metricValues: { value: string }[]; }
interface GaData {
  mainReport?: { totals: { metricValues: GaMetric[] }[] };
  pagesReport?: { rows: GaReportRow[] };
  devicesReport?: { rows: GaReportRow[] };
  citiesReport?: { rows: GaReportRow[] };
  osReport?: { rows: GaReportRow[] }; // Added for OS data
}
interface BookingData { total: number; approved: number; cancelled: number; pending: number; }
interface AnalyticsData { googleAnalytics: GaData | null; firebase: BookingData | null; }

// --- Reusable Components ---
const MetricCard = ({ title, metric, helpText }: { title: string; metric: string; helpText?: string }) => (
  <div className="analytics-card">
    <p className="card-title">{title}</p>
    <p className="card-metric">{metric}</p>
    {helpText && <p className="text-xs text-gray-500 mt-2">{helpText}</p>}
  </div>
);

const DataTable = ({ title, headers, data }: { title: string; headers: string[]; data: (string | number)[][] }) => (
    <div className="analytics-card table-card full-width-card">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {headers.map((header) => (<th key={header}>{header}</th>))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={j === row.length - 1 ? 'value-cell' : ''}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
);

// --- Main Page Component ---
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [gaResponse, fbResponse] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/bookings')
        ]);

        if (!gaResponse.ok || !fbResponse.ok) {
          throw new Error('Failed to fetch all analytics data');
        }

        const googleAnalytics = await gaResponse.json();
        const firebase = await fbResponse.json();
        setData({ googleAnalytics, firebase });

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // -- Render & Formatting Logic --
  if (loading) return <div>Loading comprehensive analytics data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div>No analytics data available.</div>;

  const formatRate = (rate: number | undefined) => rate ? `${(rate * 100).toFixed(1)}%` : '0%';
  const ga = data.googleAnalytics;
  const fb = data.firebase;

  const [activeUsers, pageViews, sessions, avgSessionDuration, engagementRate] = ga?.mainReport?.totals?.[0]?.metricValues.map(m => m.value) || Array(5).fill('0');
  const pagesData = ga?.pagesReport?.rows?.map(row => [
    row.dimensionValues[1].value || '/',
    row.dimensionValues[0].value || 'Default Title',
    parseInt(row.metricValues[0].value, 10)
  ]) || [];
  const devicesData = ga?.devicesReport?.rows?.map(row => [row.dimensionValues[0].value, parseInt(row.metricValues[0].value, 10)]) || [];
  const citiesData = ga?.citiesReport?.rows?.map(row => [row.dimensionValues[0].value, parseInt(row.metricValues[0].value, 10)]) || [];
  const osData = ga?.osReport?.rows?.map(row => [row.dimensionValues[0].value, parseInt(row.metricValues[0].value, 10)]) || [];

  const totalVisitors = parseInt(sessions, 10);
  const totalBookings = fb?.total || 0;
  const visitorToBookingRatio = totalVisitors > 0 ? (totalBookings / totalVisitors) : 0;
  const approvalRate = totalBookings > 0 ? ((fb?.approved || 0) / totalBookings) : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {/* --- Business Operations Section --- */}
      <section className='mb-12'>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Business Operations (All Time)</h2>
        <div className="analytics-grid">
          <MetricCard title="Total Test Ride Bookings" metric={totalBookings.toString()} />
          <MetricCard title="Approved Bookings" metric={fb?.approved.toString() || '0'} />
          <MetricCard title="Cancelled Bookings" metric={fb?.cancelled.toString() || '0'} />
          <MetricCard title="Pending Review" metric={fb?.pending.toString() || '0'} helpText="Action required by your team" />
          <MetricCard title="Visitor-to-Booking Ratio" metric={formatRate(visitorToBookingRatio)} helpText="How many website visitors become leads"/>
          <MetricCard title="Booking Approval Rate" metric={formatRate(approvalRate)} helpText="Percentage of valid leads approved" />
        </div>
      </section>

      {/* --- Website Performance Section --- */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Website Performance (Last 7 Days)</h2>
        <div className="analytics-grid">
          <MetricCard title="Active Users" metric={activeUsers} />
          <MetricCard title="Total Sessions" metric={sessions} />
          <MetricCard title="Engagement Rate" metric={formatRate(parseFloat(engagementRate))} />
        </div>
        <div className="mt-6">
            <DataTable 
              title="Top Pages by Views" 
              headers={['Page Path', 'Page Title', 'Views']}
              data={pagesData} 
            />
        </div>
        <div className="analytics-grid mt-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <DataTable 
              title="Audience by Device"
              headers={['Device Type', 'Users']}
              data={devicesData} 
            />
            <DataTable 
              title="Audience by City"
              headers={['City', 'Users']}
              data={citiesData} 
            />
            <DataTable 
              title="Audience by OS"
              headers={['Operating System', 'Users']}
              data={osData} 
            />
        </div>
      </section>
    </div>
  );
}
