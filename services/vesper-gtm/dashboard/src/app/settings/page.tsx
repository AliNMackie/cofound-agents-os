"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiKeys, createApiKey, revokeApiKey, ApiKey } from "@/lib/api/sentinel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Copy, Shield, CreditCard, User } from "lucide-react";
import { LayoutShell } from "@/components/layout-shell";
import { ListingsTable, ListingsRow, ListingsCell } from "@/components/ui/listings-table";
import { StatusBadgePill } from "@/components/ui/status-badge-pill";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
    const { user } = useAuth();
    // Mock subscription for launch readiness
    const subscription = { role: "admin_preview", plan: "Enterprise Pilot", status: "Active" };
    const [activeTab, setActiveTab] = useState("general");

    // API Keys State
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [keysLoading, setKeysLoading] = useState(false);
    const [newKeyLabel, setNewKeyLabel] = useState("");
    const [creatingKey, setCreatingKey] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === "api-keys") {
            loadApiKeys();
        }
    }, [activeTab]);

    async function loadApiKeys() {
        setKeysLoading(true);
        try {
            const keys = await getApiKeys();
            setApiKeys(keys);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load API keys: " + (error instanceof Error ? error.message : ""));
        } finally {
            setKeysLoading(false);
        }
    }

    async function handleCreateKey() {
        if (!newKeyLabel.trim()) return;
        setCreatingKey(true);
        try {
            const result = await createApiKey(newKeyLabel);
            setApiKeys([result, ...apiKeys]);
            setNewlyCreatedKey(result.key || null);
            setNewKeyLabel("");
            toast.success("API key created");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create API key");
        } finally {
            setCreatingKey(false);
        }
    }

    async function handleRevokeKey(id: string) {
        if (!confirm("Are you sure you want to revoke this key? It will stop working immediately.")) return;
        try {
            await revokeApiKey(id);
            setApiKeys(apiKeys.filter(k => k.id !== id));
            toast.success("Key revoked");
        } catch (error) {
            console.error(error);
            toast.error("Failed to revoke key");
        }
    }

    return (
        <LayoutShell>
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1">Settings</h1>
                <p className="text-gray-500">Manage account, security, and billing.</p>
            </div>

            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[var(--color-surface)] border border-[var(--color-border)] p-1 h-auto rounded-xl w-full md:w-auto flex-wrap justify-start mb-8">
                    <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-white text-gray-400">
                        <User className="w-4 h-4 mr-2" /> General
                    </TabsTrigger>
                    <TabsTrigger value="api-keys" className="rounded-lg data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-white text-gray-400">
                        <Shield className="w-4 h-4 mr-2" /> API Keys
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-white text-gray-400">
                        <CreditCard className="w-4 h-4 mr-2" /> Subscription
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
                        <CardHeader>
                            <CardTitle className="text-white">Profile Information</CardTitle>
                            <CardDescription className="text-gray-500">Managed via Firebase Authentication.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-xl">
                            <div className="grid gap-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Display Name</label>
                                <Input value={user?.displayName || ""} disabled className="bg-[var(--color-background)] border-[var(--color-border)] text-white" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Email</label>
                                <Input value={user?.email || ""} disabled className="bg-[var(--color-background)] border-[var(--color-border)] text-white" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">System Role</label>
                                <div className="flex">
                                    <StatusBadgePill status="info">{subscription?.role.toUpperCase() || "USER"}</StatusBadgePill>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api-keys">
                    <div className="space-y-6">
                        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
                            <CardHeader>
                                <CardTitle className="text-white">Create New Key</CardTitle>
                                <CardDescription className="text-gray-500">Generate secret keys to access the Sentinel API programmatically.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 items-end max-w-2xl">
                                    <div className="grid gap-2 flex-1">
                                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Key Label</label>
                                        <Input
                                            placeholder="e.g. Production Server, CI/CD"
                                            value={newKeyLabel}
                                            onChange={(e) => setNewKeyLabel(e.target.value)}
                                            className="bg-[var(--color-background)] border-[var(--color-border)] text-white"
                                        />
                                    </div>
                                    <button className="btn-primary" onClick={handleCreateKey} disabled={!newKeyLabel.trim() || creatingKey}>
                                        {creatingKey ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Create Key
                                    </button>
                                </div>

                                {newlyCreatedKey && (
                                    <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                                        <p className="text-sm font-bold text-yellow-500 mb-2 flex items-center">
                                            <Shield className="w-4 h-4 mr-2" />
                                            Save this key now! It won't be shown again.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-black p-3 rounded border border-[var(--color-border)] flex-1 font-mono text-sm text-white">{newlyCreatedKey}</code>
                                            <Button variant="outline" size="icon" onClick={() => {
                                                navigator.clipboard.writeText(newlyCreatedKey);
                                                toast.success("Copied to clipboard");
                                            }}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <h3 className="text-lg font-bold text-white">Active Keys</h3>

                        {keysLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-gray-500" /></div>
                        ) : apiKeys.length === 0 ? (
                            <div className="text-center p-12 border border-dashed border-[var(--color-border)] rounded-xl text-gray-500">
                                No active API keys found.
                            </div>
                        ) : (
                            <ListingsTable headers={["Label", "Prefix", "Created", "Status", "Actions"]}>
                                {apiKeys.map((key) => (
                                    <ListingsRow key={key.id}>
                                        <ListingsCell>
                                            <span className="font-semibold text-white">{key.label}</span>
                                        </ListingsCell>
                                        <ListingsCell>
                                            <code className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">{key.prefix}</code>
                                        </ListingsCell>
                                        <ListingsCell>
                                            <span className="text-sm text-gray-400">{new Date(key.created_at).toLocaleDateString()}</span>
                                        </ListingsCell>
                                        <ListingsCell>
                                            <StatusBadgePill status="success">ACTIVE</StatusBadgePill>
                                        </ListingsCell>
                                        <ListingsCell>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-900/20" onClick={() => handleRevokeKey(key.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </ListingsCell>
                                    </ListingsRow>
                                ))}
                            </ListingsTable>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="subscription">
                    <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
                        <CardHeader>
                            <CardTitle className="text-white">Subscription Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white text-lg mb-1">{subscription?.plan || "Free Tier"}</p>
                                    <div className="flex items-center gap-2">
                                        <StatusBadgePill status="success">ACTIVE</StatusBadgePill>
                                        <span className="text-sm text-gray-500">Renews on Mar 01, 2026</span>
                                    </div>
                                </div>
                                <Button variant="outline" disabled className="border-gray-600 text-gray-400">Manage Billing</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </LayoutShell>
    );
}
