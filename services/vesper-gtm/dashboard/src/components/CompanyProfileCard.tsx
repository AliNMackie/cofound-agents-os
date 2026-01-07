'use client';

import { CompanyProfile } from '@/types/sentinel';

interface CompanyProfileCardProps {
    profile: CompanyProfile;
}

export default function CompanyProfileCard({ profile }: CompanyProfileCardProps) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                    Official Registry Data
                </h3>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {/* Registration Number */}
                {profile.registration_number && (
                    <div>
                        <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                            Registration Number
                        </dt>
                        <dd>
                            <a
                                href={`https://find-and-update.company-information.service.gov.uk/company/${profile.registration_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                {profile.registration_number}
                            </a>
                        </dd>
                    </div>
                )}

                {/* Incorporation Date */}
                {profile.incorporation_date && (
                    <div>
                        <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                            Incorporated
                        </dt>
                        <dd className="text-sm text-slate-900">
                            {new Date(profile.incorporation_date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </dd>
                    </div>
                )}

                {/* Company Status */}
                {profile.company_status && (
                    <div>
                        <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                            Status
                        </dt>
                        <dd>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.company_status.toLowerCase() === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                {profile.company_status}
                            </span>
                        </dd>
                    </div>
                )}

                {/* Company Type */}
                {profile.company_type && (
                    <div>
                        <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                            Type
                        </dt>
                        <dd className="text-sm text-slate-900 uppercase">
                            {profile.company_type}
                        </dd>
                    </div>
                )}

                {/* SIC Codes */}
                {profile.sic_codes && profile.sic_codes.length > 0 && (
                    <div>
                        <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                            Industry Codes
                        </dt>
                        <dd className="space-y-1">
                            {profile.sic_codes.map((code, index) => (
                                <div key={index} className="text-sm text-slate-700">
                                    {code}
                                </div>
                            ))}
                        </dd>
                    </div>
                )}

                {/* Registered Address */}
                {profile.registered_address && (
                    <div>
                        <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                            Registered Address
                        </dt>
                        <dd className="text-sm text-slate-700 leading-relaxed">
                            {profile.registered_address}
                        </dd>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                    Data sourced from Companies House
                </p>
            </div>
        </div>
    );
}
