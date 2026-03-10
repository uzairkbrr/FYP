import React, { useRef } from 'react'
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import VoiceCard from "../components/VoiceCard";
import ProjectInfo from "../components/ProjectInfo";
import HowItWorks from "../components/HowItWorks";
import Team from "../components/Team";
import Supervisor from "../components/Supervisor";
import TestCases from "../components/TestCases";
import { useTheme } from "../context/ThemeContext";

export default function Home() {
    const { theme } = useTheme();
    const voiceCardRef = useRef(null);

    const scrollToVoice = () => {
        voiceCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <div className="min-h-screen font-sans selection:bg-primary/20 selection:text-primary">
            <Navbar />

            <main>
                <Hero onStartQuery={scrollToVoice} />

                <div id="voice-section" ref={voiceCardRef} className="py-24 px-6 relative">
                    <div className="max-w-5xl mx-auto">
                        <VoiceCard />
                    </div>
                </div>

                <TestCases />

                <div id="mission-section">
                    <ProjectInfo />
                </div>
                <HowItWorks />
                <Team />
                <Supervisor />
            </main>

        </div>
    )
}
