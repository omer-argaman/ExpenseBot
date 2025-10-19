import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";

export default function ChatInput({ onSend, isProcessing }) {
  const [message, setMessage] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-lg p-2 flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Try: 'dinner 45' or 'gas 60 filled up at Shell'"
          className="border-0 focus-visible:ring-0 resize-none min-h-[60px] max-h-32 bg-transparent"
          disabled={isProcessing}
        />
        <Button
          type="submit"
          disabled={!message.trim() || isProcessing}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl px-6 h-12 shadow-lg shadow-indigo-500/30"
        >
          {isProcessing ? (
            <Sparkles className="w-5 h-5 animate-pulse" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-400 mt-2 px-4">
        Type naturally - we'll understand! Example: "coffee 5.50 morning latte"
      </p>
    </form>
  );
}