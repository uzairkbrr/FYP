import React, { useState, useEffect } from 'react';

const TestCases = () => {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the summary.json from our directory
        fetch('/test_results/summary.json')
            .then(res => res.json())
            .then(data => {
                setTestCases(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load test cases:", err);
                setLoading(false);
            });
    }, []);

    if (testCases.length === 0) {
        return null;
    }

    return (
        <div className="py-24 px-6 relative" id="test-cases-section">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                        Test Cases
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testCases.map((tc, idx) => (
                        <div key={idx} className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">

                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2 border-b pb-2">Input Voice Note #{idx + 1}</h3>
                                <audio controls src={`/${tc.input_audio.replace(/\\\\/g, '/')}`} className="w-full mb-3 h-10" />
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                                    {tc.input_roman}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2 border-b pb-2 text-primary">Generated Response</h3>
                                <p className="text-sm text-gray-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-3">
                                    {tc.response_roman || <span className="italic">No text response generated</span>}
                                </p>
                                <audio controls src={`/${tc.response_audio.replace(/\\\\/g, '/')}`} className="w-full h-10" />
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestCases;
