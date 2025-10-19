import React, { useState, useEffect, useRef } from "react";
import { Category } from "@/entities/Category";
import { Expense } from "@/entities/Expense";
import { Household } from "@/entities/Household";
import { User } from "@/entities/User";
import { InvokeLLM } from "@/integrations/Core";
import { AnimatePresence } from "framer-motion";
import { Sparkles, Info, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import QuickActions from "../components/chat/QuickActions";
import CategorySuggestions from "../components/chat/CategorySuggestions";
import EditExpenseDialog from "../components/chat/EditExpenseDialog";

// Common spelling corrections
const SPELLING_CORRECTIONS = {
  'dinr': 'dinner',
  'dinnr': 'dinner',
  'luch': 'lunch',
  'brekfast': 'breakfast',
  'breakfst': 'breakfast',
  'coffe': 'coffee',
  'cofee': 'coffee',
  'resturant': 'restaurant',
  'restraunt': 'restaurant',
  'grocry': 'grocery',
  'groceries': 'grocery',
  'gass': 'gas',
  'feul': 'fuel',
  'entertaiment': 'entertainment',
  'moive': 'movie'
};

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: "assistant",
      text: "Hi! I'm here to help you track expenses. Just tell me what you spent - like 'dinner 30' or 'gas 60 filled up the car'. I'll figure out the rest! 💰"
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [lastExpense, setLastExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [household, setHousehold] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);

    // Find household for current user
    const households = await Household.list();
    const userHousehold = households.find(h => h.member_emails?.includes(currentUser.email));
    setHousehold(userHousehold);

    if (userHousehold) {
      const cats = await Category.filter({ household_id: userHousehold.id });
      setCategories(cats);
      
      const expenses = await Expense.filter({ household_id: userHousehold.id }, "-date", 10);
      setRecentExpenses(expenses);
      if (expenses.length > 0) {
        setLastExpense(expenses[0]);
      }
    } else {
      // No household - load personal categories
      const cats = await Category.filter({ created_by: currentUser.email });
      setCategories(cats);
      
      const expenses = await Expense.filter({ created_by: currentUser.email }, "-date", 10);
      setRecentExpenses(expenses);
      if (expenses.length > 0) {
        setLastExpense(expenses[0]);
      }
    }
  };

  const correctSpelling = (text) => {
    let corrected = text.toLowerCase();
    Object.entries(SPELLING_CORRECTIONS).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    });
    return corrected;
  };

  const processMessage = async (message) => {
    const correctedMessage = correctSpelling(message);
    
    setMessages(prev => [...prev, { type: "user", text: message }]);
    setIsProcessing(true);

    try {
      const categoryContext = categories.map(cat => 
        `Category: "${cat.name}" (umbrella: ${cat.umbrella_category}, keywords: ${cat.keywords?.join(', ') || 'none'})`
      ).join('\n');

      const prompt = `You are an expense tracking assistant. Parse this user message into an expense.

User message: "${correctedMessage}"

Available categories:
${categoryContext}

Extract:
1. The amount (required)
2. The best matching category based on keywords or context
3. Any note/description from the message

Return ONLY valid JSON matching this exact structure (no other text):
{
  "amount": number,
  "category_name": "exact category name from the list above",
  "note": "any additional context from the message or null if none"
}

If you cannot determine the amount or category, return:
{
  "error": "explanation of what's missing or unclear"
}`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            amount: { type: "number" },
            category_name: { type: "string" },
            note: { type: "string" },
            error: { type: "string" }
          }
        }
      });

      if (response.error) {
        setMessages(prev => [...prev, {
          type: "assistant",
          text: `I couldn't understand that. ${response.error}. Try something like: "dinner 30" or "gas 60 filled up the car"`
        }]);
        setIsProcessing(false);
        return;
      }

      const category = categories.find(c => c.name === response.category_name);
      
      if (!category) {
        setMessages(prev => [...prev, {
          type: "assistant",
          text: `I couldn't find a category called "${response.category_name}". Please add it in the Categories page first, or try a different keyword.`
        }]);
        setIsProcessing(false);
        return;
      }

      const expense = await Expense.create({
        amount: response.amount,
        category_id: category.id,
        category_name: category.name,
        note: response.note || null,
        date: new Date().toISOString(),
        household_id: household?.id || null
      });

      setMessages(prev => [...prev, {
        type: "expense",
        expense: expense
      }]);

      setLastExpense(expense);
      setRecentExpenses(prev => [expense, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error("Error processing message:", error);
      setMessages(prev => [...prev, {
        type: "assistant",
        text: "Sorry, I had trouble processing that. Please try again!"
      }]);
    }

    setIsProcessing(false);
  };

  const handleUndo = async () => {
    if (!lastExpense) return;
    
    await Expense.delete(lastExpense.id);
    setMessages(prev => [...prev, {
      type: "assistant",
      text: `Undone! Deleted the ${lastExpense.category_name} expense of $${lastExpense.amount.toFixed(2)}.`
    }]);
    
    const expenses = await Expense.filter(
      household ? { household_id: household.id } : { created_by: user.email },
      "-date",
      10
    );
    setRecentExpenses(expenses);
    setLastExpense(expenses[0] || null);
  };

  const handleEdit = () => {
    setEditingExpense(lastExpense);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async (updatedData) => {
    await Expense.update(editingExpense.id, updatedData);
    setShowEditDialog(false);
    
    setMessages(prev => [...prev, {
      type: "assistant",
      text: `Updated! Changed to ${updatedData.category_name} - $${updatedData.amount.toFixed(2)}.`
    }]);

    const expenses = await Expense.filter(
      household ? { household_id: household.id } : { created_by: user.email },
      "-date",
      10
    );
    setRecentExpenses(expenses);
    setLastExpense(expenses[0]);
  };

  const handleCategorySelect = (category) => {
    setMessages(prev => [...prev, {
      type: "assistant",
      text: `Selected ${category.name}! Now just tell me the amount. For example: "${category.keywords?.[0] || category.name.toLowerCase()} 25"`
    }]);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {!household && (
            <Alert className="mb-6 border-indigo-200 bg-indigo-50">
              <Users className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-900 flex items-center justify-between">
                <span>
                  <strong>Tracking solo?</strong> Create a household to share expenses with your girlfriend!
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Household"))}
                  className="ml-4 border-indigo-300 hover:bg-indigo-100"
                >
                  Setup
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {categories.length === 0 && (
            <Alert className="mb-6 border-indigo-200 bg-indigo-50">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-900">
                <strong>Getting started:</strong> Add your first categories in the Categories page to start tracking expenses!
              </AlertDescription>
            </Alert>
          )}

          <CategorySuggestions 
            categories={categories} 
            onSelect={handleCategorySelect}
          />

          <AnimatePresence>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-slate-200/60 bg-white/80 backdrop-blur-sm p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <QuickActions
            lastExpense={lastExpense}
            onUndo={handleUndo}
            onEdit={handleEdit}
            recentExpenses={recentExpenses}
          />
          <ChatInput onSend={processMessage} isProcessing={isProcessing} />
        </div>
      </div>

      <EditExpenseDialog
        expense={editingExpense}
        categories={categories}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}