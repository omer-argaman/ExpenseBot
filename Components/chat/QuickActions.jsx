import React from "react";
import { Button } from "@/components/ui/button";
import { Undo, Edit, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickActions({ lastExpense, onUndo, onEdit, recentExpenses }) {
  if (!lastExpense && (!recentExpenses || recentExpenses.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 mb-4"
    >
      {lastExpense && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="border-slate-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 rounded-xl"
          >
            <Undo className="w-4 h-4 mr-2" />
            Undo Last
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 rounded-xl"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Last
          </Button>
        </>
      )}
      
      {recentExpenses && recentExpenses.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 ml-2">
          <Clock className="w-3 h-3" />
          <span>Recent: {recentExpenses.slice(0, 3).map(e => e.category_name).join(', ')}</span>
        </div>
      )}
    </motion.div>
  );
}