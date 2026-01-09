"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Globe, Rss, Database, RefreshCw } from "lucide-react"
import { DataSource } from "@/types/settings"

// Mock initial data
const INITIAL_SOURCES: DataSource[] = [
    {
        id: "1",
        name: "The Gazette (Insolvency)",
        url: "https://www.thegazette.co.uk/insolvency/notice/feed",
        type: "RSS",
        active: true,
        lastChecked: new Date()
    },
    {
        id: "2",
        name: "Companies House API",
        url: "https://api.company-information.service.gov.uk",
        type: "API",
        active: true,
        lastChecked: new Date()
    }
]

export default function SourceManagerPage() {
    const [sources, setSources] = React.useState<DataSource[]>(INITIAL_SOURCES)
    const [newSource, setNewSource] = React.useState({ name: "", url: "", type: "RSS" as const })

    const handleAddSource = () => {
        if (!newSource.name || !newSource.url) return
        const source: DataSource = {
            id: Math.random().toString(36).substring(7),
            name: newSource.name,
            url: newSource.url,
            type: newSource.type,
            active: true,
            lastChecked: new Date()
        }
        setSources([...sources, source])
        setNewSource({ name: "", url: "", type: "RSS" })
    }

    const handleDelete = (id: string) => {
        setSources(sources.filter(s => s.id !== id))
    }

    const toggleActive = (id: string) => {
        setSources(sources.map(s => s.id === id ? { ...s, active: !s.active } : s))
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "RSS": return <Rss className="h-4 w-4" />
            case "API": return <Globe className="h-4 w-4" />
            case "Scrape": return <Database className="h-4 w-4" />
            default: return <Globe className="h-4 w-4" />
        }
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
                <p className="text-muted-foreground">Manage the intelligence feeds that power the Sentinel Engine.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Source</CardTitle>
                    <CardDescription>Connect a new RSS feed, API endpoint, or scraping target.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="grid w-full gap-1.5">
                            <label className="text-sm font-medium">Source Name</label>
                            <Input
                                placeholder="e.g. Financial Times M&A"
                                value={newSource.name}
                                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                            />
                        </div>
                        <div className="grid w-full gap-1.5">
                            <label className="text-sm font-medium">URL / Endpoint</label>
                            <Input
                                placeholder="https://..."
                                value={newSource.url}
                                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                            />
                        </div>
                        <div className="grid w-[200px] gap-1.5">
                            <label className="text-sm font-medium">Type</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newSource.type}
                                onChange={(e) => setNewSource({ ...newSource, type: e.target.value as any })}
                            >
                                <option value="RSS">RSS Feed</option>
                                <option value="API">JSON API</option>
                                <option value="Scrape">Web Scraper</option>
                            </select>
                        </div>
                        <Button onClick={handleAddSource} className="gap-2">
                            <Plus className="h-4 w-4" /> Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Sources</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Type</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>URL</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Sync</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sources.map((source) => (
                                <TableRow key={source.id} className={!source.active ? "opacity-50" : ""}>
                                    <TableCell>{getIcon(source.type)}</TableCell>
                                    <TableCell className="font-medium">{source.name}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-xs truncate max-w-[300px]">{source.url}</TableCell>
                                    <TableCell>
                                        <Badge variant={source.active ? "default" : "secondary"} className="cursor-pointer" onClick={() => toggleActive(source.id)}>
                                            {source.active ? "Active" : "Paused"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-brand-text-secondary text-xs">
                                        {source.lastChecked?.toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(source.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
