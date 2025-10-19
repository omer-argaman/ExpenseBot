import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CategorySuggestions({ categories, onSelect }) {
  const topCategories = categories.slice(0, 6);

  if (topCategories.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-xs text-slate-500 mb-2 px-1">Quick categories:</p>
      <div className="flex flex-wrap gap-2">
        {topCategories.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(cat)}
              className="border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-2"
              style={{ borderColor: cat.color + '40' }}
            >
              <span>{cat.icon}</span>
              <span className="text-xs">{cat.name}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}