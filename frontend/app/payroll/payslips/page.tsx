"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, authenticatedFetch } from "@/app/context/AuthContext";

interface Payslip {
  _id: string;
  month: string;
  netPay: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const loadPayslips = useCallback(async () => {
    if (!isLoggedIn || !user) return;

    try {
      setError(null);
      const response = await authenticatedFetch(
        `${API_BASE_URL}/payroll-tracking/me/payslips`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payslips");
      }

      const data = await response.json();
      setPayslips(data);
    } catch (err) {
      console.error("Failed to load payslips:", err);
      setError("Failed to load payslips. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!authLoading) {
      loadPayslips();
    }
  }, [loadPayslips, authLoading]);

  if (authLoading || loading) return <div>Loading...</div>;

  if (!isLoggedIn) return <div>Please log in to view payslips</div>;

  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h1>My Payslips</h1>
      {payslips.length === 0 ? (
        <p>No payslips found</p>
      ) : (
        <ul>
          {payslips.map((slip) => (
            <li key={slip._id}>
              {slip.month} - ${slip.netPay.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
