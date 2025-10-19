import React, { useState, useEffect } from "react";
import { Household } from "@/entities/Household";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, Home, Mail, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HouseholdPage() {
  const [household, setHousehold] = useState(null);
  const [user, setUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);

    const households = await Household.list();
    const userHousehold = households.find(h => h.member_emails?.includes(currentUser.email));
    setHousehold(userHousehold);
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) return;

    await Household.create({
      name: householdName,
      member_emails: [user.email]
    });

    setIsCreating(false);
    setHouseholdName("");
    loadData();
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !household) return;

    const updatedEmails = [...(household.member_emails || []), newMemberEmail.trim()];
    await Household.update(household.id, {
      member_emails: updatedEmails
    });

    setNewMemberEmail("");
    loadData();
  };

  const handleRemoveMember = async (emailToRemove) => {
    if (!household) return;

    const updatedEmails = household.member_emails.filter(e => e !== emailToRemove);
    await Household.update(household.id, {
      member_emails: updatedEmails
    });

    loadData();
  };

  if (!household && !isCreating) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <Users className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Household</h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Share expense tracking with your girlfriend, family, or roommates. 
              Everyone can add expenses and see the same budget.
            </p>

            <Alert className="mb-8 border-indigo-200 bg-indigo-50 text-left">
              <Home className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-900">
                <strong>What you'll get:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✓ Shared expense tracking</li>
                  <li>✓ Joint budget monitoring</li>
                  <li>✓ See who added what</li>
                  <li>✓ Work together on financial goals</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Household
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Create Your Household</CardTitle>
              <CardDescription>Give your household a name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Household Name</Label>
                <Input
                  id="name"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g., Smith Family, John & Jane, Apartment 4B"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateHousehold();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateHousehold}
                  disabled={!householdName.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Create Household
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            {household?.name}
          </h1>
          <p className="text-slate-500 mt-2">Manage household members and shared access</p>
        </div>

        <Card className="border-none shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Household Members
            </CardTitle>
            <CardDescription>
              People who can view and add expenses to this household
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {household?.member_emails?.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-700 font-semibold text-sm">
                        {email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{email}</p>
                      {email === user?.email && (
                        <Badge variant="secondary" className="mt-1 text-xs">You</Badge>
                      )}
                      {email === household.created_by && (
                        <Badge variant="outline" className="mt-1 text-xs ml-2">Owner</Badge>
                      )}
                    </div>
                  </div>
                  {email !== household.created_by && email !== user?.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(email)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="email" className="mb-2 block">Add New Member</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="pl-10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddMember();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!newMemberEmail.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                They'll be able to track expenses once they sign in with this email
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert className="border-indigo-200 bg-indigo-50">
          <Users className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="text-indigo-900">
            <strong>Tip:</strong> All members can see and add expenses, categories, and budgets. 
            Work together to reach your financial goals!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}