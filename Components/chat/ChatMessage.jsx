
import React from "react";
import { motion } from "framer-motion";
import { Receipt, Calendar, Tag, StickyNote } from "lucide-react";
import { format } from "date-fns";

export default function ChatMessage({ message }) {
  if (message.type === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end mb-4"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-3xl rounded-tr-sm max-w-md shadow-lg shadow-indigo-500/20">
          <p className="font-medium">{message.text}</p>
        </div>
      </motion.div>
    );
  }

  if (message.type === "expense") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start mb-4"
      >
        <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-sm p-5 max-w-md shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Expense Added!</p>
              <p className="text-sm text-slate-500">Successfully logged</p>
            </div>
          </div>
          
          <div className="space-y-3 bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Amount</span>
              <span className="text-2xl font-bold text-slate-900">₪{message.expense.amount.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-600">Category:</span>
              <span className="font-medium text-slate-900">{message.expense.category_name}</span>
            </div>
            
            {message.expense.note && (
              <div className="flex items-start gap-2 text-sm">
                <StickyNote className="w-4 h-4 text-purple-600 mt-0.5" />
                <div>
                  <span className="text-slate-600">Note:</span>
                  <p className="font-medium text-slate-900 mt-1">{message.expense.note}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(message.expense.date), "PPp")}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-start mb-4"
    >
      <div className="bg-white border border-slate-200 px-6 py-3 rounded-3xl rounded-tl-sm max-w-md shadow-sm">
        <p className="text-slate-700">{message.text}</p>
      </div>
    </motion.div>
  );
}
