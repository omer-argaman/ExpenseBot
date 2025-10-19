import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecurringExpenseForm({ recurringExpense, categories, onSave, onCancel }) {
  const [formData, setFormData] = React.useState({
    name: recurringExpense?.name || "",
    amount: recurringExpense?.amount || "",
    category_id: recurringExpense?.category_id || "",
    day_of_month: recurringExpense?.day_of_month || 1,
    is_active: recurringExpense?.is_active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedCategory = categories.find(c => c.id === formData.category_id);
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      category_name: selectedCategory?.name
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Expense Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Rent, Netflix, Gym Membership"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Monthly Amount (₪)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="e.g., 3500"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="day">Day of Month</Label>
        <Select
          value={formData.day_of_month.toString()}
          onValueChange={(value) => setFormData({ ...formData, day_of_month: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={day.toString()}>
                Day {day} of every month
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">We limit to day 28 to ensure it works for all months</p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600">
          {recurringExpense ? 'Update' : 'Create'} Recurring Expense
        </Button>
      </div>
    </form>
  );
}