import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="py-20 border-t border-white/5 relative z-10 bg-[#05070A]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded shadow-lg" />
                            <span className="font-black tracking-tighter text-lg text-white uppercase">IC ORIGIN</span>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                            IC ORIGIN – The strategic infrastructure layer for absolute market understanding.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 text-sm">Platform</h4>
                        <ul className="space-y-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Ingest Swarm</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Topology Mapping</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Strategy Memos</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 text-sm">Legal</h4>
                        <ul className="space-y-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-6 saturate-0 opacity-40 hover:saturate-100 hover:opacity-100 transition-all duration-700">
                    <p className="text-[10px] font-mono tracking-tighter uppercase">© 2026 IC ORIGIN // SYSTEM_STATUS=ACTIVE // SESSION_ID=MKTG-0226</p>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <a href="#" className="hover:text-emerald-400 transition-colors">LinkedIn</a>
                        <a href="#" className="hover:text-emerald-400 transition-colors">X / Twitter</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
