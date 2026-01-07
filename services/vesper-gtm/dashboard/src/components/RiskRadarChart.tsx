"use client";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RiskData {
    metric: string;
    value: number;
}

interface RiskRadarChartProps {
    data: RiskData[];
    title?: string;
    description?: string;
}

export function RiskRadarChart({ data, title = "Deal Risk Profile", description = "Comparison of key M&A risk vectors" }: RiskRadarChartProps) {
    return (
        <Card className="flex flex-col h-full bg-white dark:bg-black dark:border-neutral-800">
            <CardHeader className="items-center pb-4">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#e5e5e5" />
                            <PolarAngleAxis
                                dataKey="metric"
                                tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={false}
                                axisLine={false}
                            />
                            <Radar
                                name="Risk Score"
                                dataKey="value"
                                stroke="#000000"
                                fill="#000000"
                                fillOpacity={0.1}
                                strokeWidth={2}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e5e5",
                                    fontSize: "12px"
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
