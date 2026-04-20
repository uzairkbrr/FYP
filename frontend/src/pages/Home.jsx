import React, { useRef, useEffect, useState } from 'react'
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import VoiceCard from "../components/VoiceCard";
import ProjectInfo from "../components/ProjectInfo";
import Team from "../components/Team";
import Supervisor from "../components/Supervisor";
import TestCases from "../components/TestCases";
import ChatWidget from "../components/ChatWidget";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";

export default function Home() {
    const voiceCardRef = useRef(null);
    const [progress, setProgress] = useState(0);

    const scrollToVoice = () => {
        voiceCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Scroll-progress bar — updates as the user moves through the page
    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const max = el.scrollHeight - el.clientHeight;
            setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Global keyboard shortcuts (/, Esc)
    useEffect(() => {
        const onKey = (e) => {
            const t = e.target;
            const tag = t.tagName;
            const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;

            if (e.key === '/' && !inInput) {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('mahir:open-widget'));
            } else if (e.key === 'Escape') {
                window.dispatchEvent(new CustomEvent('mahir:close-widget'));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="min-h-screen font-sans selection:bg-primary/20 selection:text-primary">
            <div className="scroll-progress" style={{ width: `${progress}%` }} />

            <Navbar />

            <main>
                <Hero onStartQuery={scrollToVoice} />

                <div id="voice-section" ref={voiceCardRef} className="py-24 px-6 relative">
                    <div className="max-w-5xl mx-auto">
                        <Reveal>
                            <VoiceCard />
                        </Reveal>
                    </div>
                </div>

                <Reveal>
                    <TestCases />
                </Reveal>

                <Reveal as="div" className="block" delay={0}>
                    <div id="mission-section">
                        <ProjectInfo />
                    </div>
                </Reveal>

                <Reveal>
                    <Team />
                </Reveal>

                <Reveal>
                    <Supervisor />
                </Reveal>
            </main>

            <Footer />

            <ChatWidget />
        </div>
    )
}
