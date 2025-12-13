"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TaxDocument {
  payrollRunId: string | null;
  taxYear: number;
  totalTaxWithheld: number;
  generatedAt: string;
}

export default function TaxDocumentsPage() {
  const router = useRouter();
  const [taxDocuments, setTaxDocuments] = useState<TaxDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    fetchTaxDocuments();
  }, []);

  const fetchTaxDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3000/payroll-tracking/tax-documents/mine",
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch tax documents");
      const data = await response.json();
      setTaxDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get unique years for filtering
  const availableYears = [
    ...new Set(taxDocuments.map((doc) => doc.taxYear)),
  ].sort((a, b) => b - a);

  const filteredDocuments =
    selectedYear === "all"
      ? taxDocuments
      : taxDocuments.filter((doc) => doc.taxYear === parseInt(selectedYear));

  // Calculate totals by year
  const yearlyTotals = availableYears.map((year) => {
    const yearDocs = taxDocuments.filter((doc) => doc.taxYear === year);
    const totalWithheld = yearDocs.reduce(
      (sum, doc) => sum + doc.totalTaxWithheld,
      0
    );
    return { year, totalWithheld, count: yearDocs.length };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tax documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.push("/payroll/tracking")}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Tax Documents
            </h1>
            <p className="text-lg text-gray-600">
              View your tax withholding history
            </p>
          </div>
          <Link
            href="/payroll/tracking"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Tracking
          </Link>
        </div>

        {/* Yearly Summary Cards */}
        {yearlyTotals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {yearlyTotals.slice(0, 3).map((yearData) => (
              <div
                key={yearData.year}
                className="bg-white rounded-lg shadow p-6"
              >
                <p className="text-gray-600 text-sm mb-2">
                  Tax Year {yearData.year}
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(yearData.totalWithheld)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {yearData.count} payment{yearData.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Filter by Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tax Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📑</div>
            <p className="text-gray-600 text-lg">No tax documents found</p>
            <p className="text-gray-500 mt-2">
              Tax documents will appear here once payslips are generated
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Withheld
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.taxYear}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {doc.generatedAt
                            ? new Date(doc.generatedAt)
                                .toISOString()
                                .slice(0, 7)
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-red-600">
                          {formatCurrency(doc.totalTaxWithheld)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {doc.generatedAt
                            ? formatDate(doc.generatedAt)
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            // Could implement download functionality
                            alert("Download feature coming soon!");
                          }}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-900 font-semibold mb-2 flex items-center">
            <span className="mr-2">ℹ️</span>
            About Tax Documents
          </h3>
          <p className="text-blue-800 text-sm">
            These documents show your tax withholding history from each payroll
            period. The total tax withheld for each year can be used for your
            annual tax return. For official tax forms (W-2, 1099, etc.), please
            contact your HR department.
          </p>
        </div>
      </div>
    </div>
  );
}
