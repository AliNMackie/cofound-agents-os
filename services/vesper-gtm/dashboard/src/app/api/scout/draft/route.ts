
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
        const endpoint = `${apiUrl}/draft`;

        console.log(`Proxxying draft request to: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Newsletter API Error:", errorText);
            return NextResponse.json(
                { error: "Failed to generate draft from engine", details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error during proxy" },
            { status: 500 }
        );
    }
}
