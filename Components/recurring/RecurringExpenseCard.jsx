import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Repeat } from "lucide-react";

export default function RecurringExpenseCard({ recurringExpense, category, onEdit, onDelete, onToggle }) {
  return (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: category?.color || '#6366f1' }}
            >
              <span className="text-white text-xl">{category?.icon || '💰'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{recurringExpense.name}</h3>
                {!recurringExpense.is_active && (
                  <Badge variant="secondary" className="text-xs">Paused</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Repeat className="w-4 h-4 text-indigo-600" />
                <span>{recurringExpense.category_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>Day {recurringExpense.day_of_month} of every month</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">₪{recurringExpense.amount.toFixed(2)}</p>
              <p className="text-xs text-slate-500">per month</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(recurringExpense)}
                className="hover:bg-slate-100 rounded-xl"
              >
                <Pencil className="w-4 h-4 text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(recurringExpense)}
                className="hover:bg-red-50 hover:text-red-600 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}