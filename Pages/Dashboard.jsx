
import React, { useState, useEffect } from "react";
import { Category } from "@/entities/Category";
import { Expense } from "@/entities/Expense";
import { Household } from "@/entities/Household";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#84cc16", "#10b981"];

export default function DashboardPage() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [household, setHousehold] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    
    const households = await Household.list();
    const userHousehold = households.find(h => h.member_emails?.includes(currentUser.email));
    setHousehold(userHousehold);

    if (userHousehold) {
      const cats = await Category.filter({ household_id: userHousehold.id });
      setCategories(cats);
      
      const allExpenses = await Expense.filter({ household_id: userHousehold.id }, "-date");
      setExpenses(allExpenses);
      
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();
      const currentMonth = allExpenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
      setMonthlyExpenses(currentMonth);
    } else {
      const cats = await Category.filter({ created_by: currentUser.email });
      setCategories(cats);
      
      const allExpenses = await Expense.filter({ created_by: currentUser.email }, "-date");
      setExpenses(allExpenses);
      
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();
      const currentMonth = allExpenses.filter(e => e.date >= monthStart && e.date <= monthEnd);
      setMonthlyExpenses(currentMonth);
    }
  };

  const totalThisMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = categories.reduce((sum, c) => sum + (c.monthly_budget || 0), 0);

  const lastMonth = expenses.filter(e => {
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString();
    return e.date >= lastMonthStart && e.date <= lastMonthEnd;
  });
  const totalLastMonth = lastMonth.reduce((sum, e) => sum + e.amount, 0);
  const percentChange = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;

  const categorySpending = categories.map(cat => ({
    name: cat.name,
    spending: monthlyExpenses.filter(e => e.category_id === cat.id).reduce((sum, e) => sum + e.amount, 0),
    budget: cat.monthly_budget || 0,
    color: cat.color || "#6366f1"
  })).filter(c => c.spending > 0).sort((a, b) => b.spending - a.spending);

  const overBudgetCategories = categorySpending.filter(c => c.budget > 0 && c.spending > c.budget);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Spending Dashboard</h1>
          <p className="text-slate-500 mt-1">Track your expenses together</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                ₪{totalThisMonth.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {percentChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
                <span className={percentChange >= 0 ? 'text-red-500' : 'text-green-500'}>
                  {Math.abs(percentChange).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                ₪{totalBudget.toFixed(2)}
              </div>
              <Progress 
                value={totalBudget > 0 ? (totalThisMonth / totalBudget) * 100 : 0} 
                className="h-2"
              />
              <p className="text-sm text-slate-500 mt-2">
                {totalBudget > 0 ? `${((totalThisMonth / totalBudget) * 100).toFixed(0)}% used` : 'No budget set'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {overBudgetCategories.length}
              </div>
              <p className="text-sm text-slate-500">
                {overBudgetCategories.length === 0 ? 'All within budget' : 'Categories over budget'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categorySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `₪${value.toFixed(2)}`} />
                    <Bar dataKey="spending" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  No expenses this month
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {categorySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      dataKey="spending"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `₪${entry.spending.toFixed(0)}`}
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  No expenses this month
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Over Budget Alert */}
        {overBudgetCategories.length > 0 && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Over Budget Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overBudgetCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <span className="font-medium text-red-900">{cat.name}</span>
                    <span className="text-red-600">
                      ₪{cat.spending.toFixed(2)} / ₪{cat.budget.toFixed(2)}
                      <span className="ml-2 text-sm">
                        (+₪{(cat.spending - cat.budget).toFixed(2)})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
