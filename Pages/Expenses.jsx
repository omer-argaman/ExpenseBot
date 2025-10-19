
import React, { useState, useEffect } from "react";
import { Expense } from "@/entities/Expense";
import { Category } from "@/entities/Category";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, Tag, StickyNote, DollarSign, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button"; // Added import for Button component
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Household } from "@/entities/Household";
import { User } from "@/entities/User";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [household, setHousehold] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    
    // Attempt to find a household the user belongs to
    const households = await Household.list();
    const userHousehold = households.find(h => h.member_emails?.includes(currentUser.email));
    setHousehold(userHousehold);

    if (userHousehold) {
      // If user is in a household, fetch expenses and categories for that household
      const exps = await Expense.filter({ household_id: userHousehold.id }, "-date");
      setExpenses(exps);
      const cats = await Category.filter({ household_id: userHousehold.id });
      setCategories(cats);
    } else {
      // Otherwise, fetch expenses and categories created by the current user
      const exps = await Expense.filter({ created_by: currentUser.email }, "-date");
      setExpenses(exps);
      const cats = await Category.filter({ created_by: currentUser.email });
      setCategories(cats);
    }
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      await Expense.delete(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
      loadData(); // Reload data after deletion
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchTerm || 
      expense.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.note?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || expense.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">All Expenses</h1>
          <p className="text-slate-500 mt-1">Complete expense history</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses..."
              className="pl-10 border-slate-200"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-64 border-slate-200">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredExpenses.map((expense) => {
              const category = categories.find(c => c.id === expense.category_id);
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: category?.color || '#6366f1' }}
                          >
                            <span className="text-white text-xl">{category?.icon || '💰'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Tag className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold text-slate-900">{expense.category_name}</span>
                            </div>
                            {expense.note && (
                              <div className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                                <StickyNote className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                <span>{expense.note}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(expense.date), "PPp")}</span>
                              <span className="text-slate-300">•</span>
                              <span>by {expense.created_by}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                            ₪{expense.amount.toFixed(2)}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(expense)}
                            className="hover:bg-red-50 hover:text-red-600 rounded-xl"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No expenses found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
              {expenseToDelete && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900">
                    {expenseToDelete.category_name} - ₪{expenseToDelete.amount.toFixed(2)}
                  </p>
                  {expenseToDelete.note && (
                    <p className="text-sm text-slate-600 mt-1">{expenseToDelete.note}</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
