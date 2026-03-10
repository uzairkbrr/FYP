import React from 'react'

const teamMembers = [
    {
        name: 'Uzair Ahmad',
        rollNo: '22P-9021',
        role: 'Team Lead',
        photo: '/images/uzair.png',
        gradient: 'from-blue-500 to-indigo-600',
        initials: 'UA'
    },
    {
        name: 'Arsalan Mateen',
        rollNo: '22P-9024',
        role: 'Member',
        photo: '/images/arsalan.png',
        gradient: 'from-emerald-500 to-teal-600',
        initials: 'AM'
    },
    {
        name: 'Muhammad Sohaib',
        rollNo: '22P-9035',
        role: 'Member',
        photo: '/images/sohaib.png',
        gradient: 'from-purple-500 to-pink-600',
        initials: 'MS'
    },
]

export default function Team() {
    return (
        <section id="team-section" className="py-24 px-6 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-text-primary mb-4 tracking-tight font-serif italic">The <span className="text-primary not-italic">Architects</span></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teamMembers.map((member, i) => (
                        <div key={i} className="group bg-surface rounded-xl border border-border/60 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-full max-w-sm mx-auto w-full">
                            {/* Photo */}
                            <div className="h-80 overflow-hidden relative transition-all duration-700">
                                {member.photo ? (
                                    <img
                                        src={member.photo}
                                        alt={member.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-slate-100 flex items-center justify-center`}>
                                        <span className="text-5xl font-black text-slate-200">{member.initials}</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-8 flex-1 flex flex-col border-t border-border/10">
                                <h3 className="text-lg font-black text-text-primary mb-1 tracking-tight font-serif uppercase">
                                    {member.name}
                                </h3>
                                <p className="text-text-muted font-bold text-[14px] uppercase tracking-widest mb-2">
                                    {member.rollNo}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
