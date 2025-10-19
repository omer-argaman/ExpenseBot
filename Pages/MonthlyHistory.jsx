import React, { useState, useEffect } from "react";
import { Expense } from "@/entities/Expense";
import { Category } from "@/entities/Category";
import { Household } from "@/entities/Household";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MonthlyHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [household, setHousehold] = useState(null);
  const [monthlyTotals, setMonthlyTotals] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await User.me();
      
      const households = await Household.list();
      const userHousehold = households.find(h => h.member_emails?.includes(currentUser.email));
      setHousehold(userHousehold);

      const monthStart = startOfMonth(selectedDate).toISOString();
      const monthEnd = endOfMonth(selectedDate).toISOString();

      let allExpenses, cats;
      if (userHousehold) {
        cats = await Category.filter({ household_id: userHousehold.id });
        allExpenses = await Expense.filter({ household_id: userHousehold.id }, "-date");
      } else {
        cats = await Category.filter({ created_by: currentUser.email });
        allExpenses = await Expense.filter({ created_by: currentUser.email }, "-date");
      }
      
      setCategories(cats);
      const monthExpenses = allExpenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
      setExpenses(monthExpenses);

      // Calculate last 6 months totals
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();
        const monthExps = allExpenses.filter(e => e.date >= start && e.date <= end);
        const total = monthExps.reduce((sum, e) => sum + e.amount, 0);
        last6Months.push({
          month: format(date, "MMM yyyy"),
          total: total
        });
      }
      setMonthlyTotals(last6Months);
    };
    
    loadData();
  }, [selectedDate]);

  const goToPreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const isCurrentMonth = format(selectedDate, "yyyy-MM") === format(new Date(), "yyyy-MM");

  const totalThisMonth = expenses.reduce((sum, e) => sum + e.amount, 0);

  const previousMonth = subMonths(selectedDate, 1);
  const prevMonthStart = startOfMonth(previousMonth).toISOString();
  const prevMonthEnd = endOfMonth(previousMonth).toISOString();
  const prevMonthTotal = monthlyTotals.find(m => m.month === format(previousMonth, "MMM yyyy"))?.total || 0;
  const percentChange = prevMonthTotal > 0 ? ((totalThisMonth - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  const categorySpending = categories.map(cat => ({
    name: cat.name,
    spending: expenses.filter(e => e.category_id === cat.id).reduce((sum, e) => sum + e.amount, 0),
    budget: cat.monthly_budget || 0,
    color: cat.color
  })).filter(c => c.spending > 0).sort((a, b) => b.spending - a.spending);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" />
            Monthly History
          </h1>
          <p className="text-slate-500 mt-1">Track your spending over time</p>
        </div>

        {/* Month Selector */}
        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousMonth}
                className="rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  {format(selectedDate, "MMMM yyyy")}
                </h2>
                {!isCurrentMonth && (
                  <Button
                    variant="link"
                    onClick={goToCurrentMonth}
                    className="text-indigo-600 text-sm mt-1"
                  >
                    Go to current month
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
                className="rounded-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                ₪{totalThisMonth.toFixed(2)}
              </div>
              {prevMonthTotal > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  {percentChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className={percentChange >= 0 ? 'text-red-500' : 'text-green-500'}>
                    {Math.abs(percentChange).toFixed(1)}% vs previous month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Number of Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {expenses.length}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                transactions this month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500">
                Average per Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                ₪{(totalThisMonth / new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()).toFixed(2)}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                daily spending rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 6 Month Trend */}
        <Card className="mb-8 border-none shadow-lg">
          <CardHeader>
            <CardTitle>6 Month Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => `₪${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySpending.length > 0 ? (
              <div className="space-y-4">
                {categorySpending.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-slate-900">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">₪{cat.spending.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {((cat.spending / totalThisMonth) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                No expenses in this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}