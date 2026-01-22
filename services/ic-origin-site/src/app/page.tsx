import Image from "next/image";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-black text-white">
            <div className="z-10 max-w-5xl w-full items-start justify-between font-mono text-sm lg:flex">
                <div className="flex items-center">
                    <Image
                        src="/logo.png"
                        alt="IC Origin Logo"
                        width={300}
                        height={100}
                        className="object-contain"
                        priority
                    />
                </div>
            </div>
            <div className="relative flex place-items-center">
                <p className="text-xl font-medium tracking-tight text-white/70">Launching 2026. The Source of Deal Flow.</p>
            </div>
        </main>
    );
}
