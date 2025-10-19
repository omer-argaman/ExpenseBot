
import React, { useState, useEffect } from "react";
import { Category } from "@/entities/Category";
import { Expense } from "@/entities/Expense";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startOfMonth, endOfMonth } from "date-fns";
import CategoryCard from "../components/categories/CategoryCard";
import CategoryForm from "../components/categories/CategoryForm";
import { Household } from "@/entities/Household";
import { User } from "@/entities/User";
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeUmbrella, setActiveUmbrella] = useState("all");
  const [household, setHousehold] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

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
      
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();
      const exps = await Expense.filter({ household_id: userHousehold.id });
      setExpenses(exps.filter(e => e.date >= monthStart && e.date <= monthEnd));
    } else {
      const cats = await Category.filter({ created_by: currentUser.email });
      setCategories(cats);
      
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();
      const exps = await Expense.filter({ created_by: currentUser.email });
      setExpenses(exps.filter(e => e.date >= monthStart && e.date <= monthEnd));
    }
  };

  const handleSave = async (categoryData) => {
    const dataWithHousehold = {
      ...categoryData,
      household_id: household?.id || null
    };

    if (editingCategory) {
      await Category.update(editingCategory.id, dataWithHousehold);
    } else {
      await Category.create(dataWithHousehold);
    }
    setShowDialog(false);
    setEditingCategory(null);
    loadData();
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowDialog(true);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await Category.delete(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadData();
    }
  };

  const getCategorySpending = (categoryId) => {
    return expenses
      .filter(e => e.category_id === categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const filteredCategories = activeUmbrella === "all"
    ? categories
    : categories.filter(c => c.umbrella_category === activeUmbrella);

  const umbrellaCategories = [
    { value: "all", label: "All Categories" },
    { value: "housing", label: "Housing" },
    { value: "transportation", label: "Transportation" },
    { value: "daily_living", label: "Daily Living" },
    { value: "entertainment", label: "Entertainment" },
    { value: "health", label: "Health" },
    { value: "savings", label: "Savings" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Expense Categories</h1>
            <p className="text-slate-500 mt-1">Organize and track your spending</p>
          </div>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setShowDialog(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Category
          </Button>
        </div>

        <Tabs value={activeUmbrella} onValueChange={setActiveUmbrella} className="mb-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            {umbrellaCategories.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No categories yet</h3>
            <p className="text-slate-500 mb-6">Create your first category to start tracking expenses</p>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Category
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                currentSpending={getCategorySpending(category.id)}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={editingCategory}
              onSave={handleSave}
              onCancel={() => {
                setShowDialog(false);
                setEditingCategory(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{categoryToDelete?.name}"? This will not delete existing expenses in this category, but you won't be able to add new expenses to it.
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
