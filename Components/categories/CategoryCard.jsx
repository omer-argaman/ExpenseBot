import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2 } from "lucide-react";

export default function CategoryCard({ category, currentSpending, onEdit, onDelete }) {
  const budgetPercentage = category.monthly_budget 
    ? (currentSpending / category.monthly_budget) * 100 
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-slate-200 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: category.color || '#6366f1' }}
            >
              <span className="text-white text-xl">{category.icon || '💰'}</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{category.name}</h3>
              <Badge variant="outline" className="mt-1 text-xs">
                {category.umbrella_category?.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(category)}
              className="hover:bg-slate-100 rounded-xl"
            >
              <Pencil className="w-4 h-4 text-slate-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(category)}
              className="hover:bg-red-50 hover:text-red-600 rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {category.keywords && category.keywords.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Keywords</p>
            <div className="flex flex-wrap gap-1">
              {category.keywords.map((keyword, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 text-xs"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {category.monthly_budget && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">This Month</span>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  ₪{currentSpending.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  of ₪{category.monthly_budget.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Progress 
                value={Math.min(budgetPercentage, 100)} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${budgetPercentage >= 100 ? 'text-red-600' : budgetPercentage >= 80 ? 'text-orange-600' : 'text-green-600'}`}>
                  {budgetPercentage.toFixed(0)}% used
                </span>
                {budgetPercentage < 100 && (
                  <span className="text-slate-500">
                    ₪{(category.monthly_budget - currentSpending).toFixed(2)} left
                  </span>
                )}
                {budgetPercentage >= 100 && (
                  <span className="text-red-600 font-medium">
                    ₪{(currentSpending - category.monthly_budget).toFixed(2)} over
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}