import React, { useState, useEffect } from "react";
import { RecurringExpense } from "@/entities/RecurringExpense";
import { Category } from "@/entities/Category";
import { Household } from "@/entities/Household";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Plus, Repeat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import RecurringExpenseForm from "../components/recurring/RecurringExpenseForm";
import RecurringExpenseCard from "../components/recurring/RecurringExpenseCard";

export default function RecurringExpensesPage() {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
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
      const recExpenses = await RecurringExpense.filter({ household_id: userHousehold.id });
      setRecurringExpenses(recExpenses);
    } else {
      const cats = await Category.filter({ created_by: currentUser.email });
      setCategories(cats);
      const recExpenses = await RecurringExpense.filter({ created_by: currentUser.email });
      setRecurringExpenses(recExpenses);
    }
  };

  const handleSave = async (expenseData) => {
    const dataWithHousehold = {
      ...expenseData,
      household_id: household?.id || null
    };

    if (editingExpense) {
      await RecurringExpense.update(editingExpense.id, dataWithHousehold);
    } else {
      await RecurringExpense.create(dataWithHousehold);
    }
    setShowDialog(false);
    setEditingExpense(null);
    loadData();
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowDialog(true);
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      await RecurringExpense.delete(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
      loadData();
    }
  };

  const totalMonthly = recurringExpenses
    .filter(e => e.is_active !== false)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Repeat className="w-8 h-8 text-indigo-600" />
              Recurring Expenses
            </h1>
            <p className="text-slate-500 mt-1">Set up monthly expenses that repeat automatically</p>
          </div>
          <Button
            onClick={() => {
              setEditingExpense(null);
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Recurring Expense
          </Button>
        </div>

        <Alert className="mb-6 border-indigo-200 bg-indigo-50">
          <Repeat className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="text-indigo-900">
            <strong>How it works:</strong> Recurring expenses are automatically added to your expenses each month on the day you specify. 
            Total monthly recurring: <strong>₪{totalMonthly.toFixed(2)}</strong>
          </AlertDescription>
        </Alert>

        {recurringExpenses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <Repeat className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No recurring expenses yet</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Set up monthly expenses like rent, subscriptions, or bills that repeat automatically
            </p>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Recurring Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recurringExpenses.map((expense) => {
              const category = categories.find(c => c.id === expense.category_id);
              return (
                <RecurringExpenseCard
                  key={expense.id}
                  recurringExpense={expense}
                  category={category}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              );
            })}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Recurring Expense' : 'Create Recurring Expense'}
              </DialogTitle>
            </DialogHeader>
            <RecurringExpenseForm
              recurringExpense={editingExpense}
              categories={categories}
              onSave={handleSave}
              onCancel={() => {
                setShowDialog(false);
                setEditingExpense(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recurring Expense?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{expenseToDelete?.name}"? This will stop it from being added automatically each month.
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
    </div>
  );
}