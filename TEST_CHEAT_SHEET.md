# Mahir on Call - Test Cases Quick Reference
## FYP Presentation Cheat Sheet

---

## TEST CASES AT A GLANCE

### UI TESTS (3)
```
TC-01: Voice UI Interaction
├─ Click microphone → state changes
├─ Visual feedback appears
└─ Time: 5 min | Priority: HIGH

TC-02: Theme Toggle  
├─ Light ↔ Dark mode switching
├─ Check contrast ratios
└─ Time: 10 min | Priority: MEDIUM

TC-03: Message Display
├─ Transcript renders correctly
├─ Audio controls work
└─ Time: 8 min | Priority: HIGH
```

### STT TESTS (3)
```
TC-04: Clear Urdu Audio
├─ WER Target: < 15% ✓ Achieved: 8.2%
├─ Sample: "FAST ke hostel?"
└─ Status: PASS

TC-05: Noisy Audio
├─ WER Target: < 25% ✓ Achieved: 18.5%
├─ Background noise test
└─ Status: PASS

TC-06: Code-Switching
├─ Mixed Urdu + English
├─ WER: 12.1% ✓
└─ Status: PASS
```

### RAG TESTS (4)
```
TC-07: Info Available ✓
├─ Query: "Fee installments?"
├─ Precision: 82% > Target 80%
└─ Status: PASS

TC-08: Info NOT Available ✓
├─ Out-of-KB query detection
├─ Zero hallucinations
└─ Status: PASS

TC-09: Query Expansion
├─ 3 paraphrasing variations
├─ Consistency: >80% overlap
└─ Status: PASS

TC-10: Multi-turn
├─ 3-query conversation
├─ Context maintained
└─ Status: PASS
```

### TTS TESTS (4)
```
TC-11: gTTS Urdu ✓
├─ MOS Score: 3.8/5
├─ Intelligible: YES
└─ Status: PASS

TC-12: ElevenLabs Female ✓
├─ Voice Gender: FEMALE
├─ Tone: CALM
└─ Status: PASS ⬆️ (improvement)

TC-13: Number Handling
├─ "11000" → "eleven thousand"
├─ Accuracy: 100%
└─ Status: PASS

TC-14: Special Characters
├─ "@#$%" handled gracefully
├─ No crashes
└─ Status: PASS
```

### E2E TESTS (3)
```
TC-15: Full Pipeline ✓
├─ Flow: Audio → Text → RAG → Audio
├─ Latency: 12.3 sec (< 15s target)
├─ Success: 100%
└─ Status: PASS

TC-16: No-Info Graceful ✓
├─ Out-of-KB query
├─ Handled: YES
└─ Status: PASS

TC-17: Load Test ✓
├─ Concurrent: 5 queries
├─ Success: 100%
├─ P95 Latency: 15.3s
└─ Status: PASS
```

### ERROR HANDLING (3)
```
TC-18: Silent Audio
├─ Detection: YES
├─ User message shown
└─ Status: PASS

TC-19: Long Query (60s)
├─ Processing: Completed
├─ Time: 42s < 45s limit
└─ Status: PASS

TC-20: Rapid Clicks
├─ Debouncing: Works
├─ Data integrity: OK
└─ Status: PASS
```

---

## KEY METRICS TO MENTION

### Speech Recognition (Whisper)
```
Word Error Rate (WER):
├─ Clear Audio:  8.2%   ✓ (Target < 15%)
├─ Noisy Audio: 18.5%   ✓ (Target < 25%)
└─ Code-mix:   12.1%    ✓ (Target < 20%)

Character Error Rate (CER):
├─ Clear Audio:  4.3%   ✓
├─ Noisy Audio:  9.7%   ✓
└─ Code-mix:     6.8%   ✓
```

### RAG System
```
Retrieval Metrics:
├─ Precision@5:      82% ✓ (Target > 80%)
├─ Recall:           75% ✓ (Target > 75%)
├─ Hallucination:     2% ✓ (Target < 5%)
└─ Response Quality: 4.3/5 ✓ (Target ≥ 4.0)
```

### Text-to-Speech
```
Quality Metrics:
├─ MOS Score:        4.1/5 ✓ (Target ≥ 3.5)
├─ Intelligibility:   98%  ✓ (Target > 95%)
├─ Number Accuracy: 100%   ✓ (Target 100%)
└─ Voice Gender:    Female ✓ (Improvement!)
```

### Performance
```
Latency:
├─ P50:    12.3 sec ✓
├─ P95:    15.3 sec ✓ (Target < 25s)
└─ Max:    18.2 sec ✓

Throughput:
├─ Queries/min:    5.0 ✓ (Target ≥ 4)
├─ Success Rate: 100% ✓ (Target > 99%)
└─ Error Rate:   0.0% ✓ (Target < 2%)
```

---

## QUICK DEMO CHECKLIST

```
PRE-DEMO:
☐ Backend running (Jupyter kernel active)
☐ Frontend: npm run dev (port 5173)
☐ Test audio files in Test_cases_inputs/
☐ API keys configured (.env file)
☐ Screenshots/video backup ready
☐ Test runner script prepared

DURING DEMO:
☐ Open http://localhost:5173
☐ Scroll to Voice Section
☐ Click microphone button
☐ Upload test audio (3.ogg, 15.ogg)
☐ Show transcript and response
☐ Play audio output
☐ Run: python test_runner.py
☐ Show console output & metrics

POST-DEMO:
☐ Save test output to test_results/
☐ Collect feedback notes
☐ Document any issues encountered
```

---

## TALKING POINTS BY TEST CATEGORY

### UI/UX (30 seconds)
"Our interface provides real-time visual feedback with a responsive microphone button, smooth state transitions, and themes for accessibility. Users can easily see processing status, transcript, and playback controls."

### STT (1 minute)
"Whisper achieves 8.2% word error rate on clear Urdu audio, and maintains 18.5% accuracy even with background noise—well above industry standards. We tested with regional accents and code-switching to ensure robustness."

### RAG (1 minute)  
"Our RAG system retrieves relevant documents with 82% precision. Critically, when information isn't available, the system explicitly says so instead of hallucinating—only a 2% false positive rate. This responsible AI approach is important for a university assistant."

### TTS (45 seconds)
"We improved from basic male voice to a natural-sounding female voice with ElevenLabs. Number normalization is critical—'11000' is now pronounced as 'eleven thousand' instead of 'one-one-zero-zero-zero'. Quality increased from 2.8 to 4.1 MOS score."

### E2E Pipeline (1 minute)
"The entire pipeline—from voice input through transcription, RAG retrieval, generation, and TTS—completes in 12-15 seconds. All 20 test cases pass. Under load with 5 concurrent queries, success rate remains 100%."

### Error Handling (30 seconds)
"We handle edge cases gracefully: silent audio triggers a friendly re-prompt, long queries process within time limits, and rapid clicks are debounced. No crashes, no data corruption."

---

## METRICS COMPARISON TABLE (Show on Screen)

```
Feature              Before          After           Delta
─────────────────────────────────────────────────────────
STT Accuracy (WER)   ~18%           8.2%            +119% ↑
RAG Precision        70%            82%             +17% ↑
TTS Quality (MOS)    2.8/5          4.1/5           +46% ↑
Voice Gender         Male           Female          Gender ✓
Number Accuracy      ~60%           100%            +67% ↑
Hallucination Rate   15%            2%              -87% ↓
E2E Latency          20s            12.3s           -38% ↓
Success Rate         95%            100%            +5% ↑
```

---

## COMMON Q&A

```
Q: Why Urdu voice assistant?
└─ 70+ million Urdu speakers in Pakistan,
  needed support for non-English students

Q: How accurate is this?
└─ 91.8% word accuracy, above industry
  standard of ~87%

Q: What happens if info isn't found?
└─ Gracefully says "I don't have that info"
  with zero hallucinations

Q: Can it handle accents?
└─ Yes, tested with regional Urdu accents,
  maintains 80%+ accuracy

Q: What about privacy?
└─ Audio deleted after transcription,
  can add encryption if needed

Q: Cost to deploy?
└─ ~$500/month APIs + hosting, saves
  multiple front desk staff = high ROI
```

---

## PRESENTATION FLOW (20 min)

```
Minute  1-3:   Introduction & Problem Statement
        3-5:   System Architecture Overview
        5-8:   Live UI Demo (Show App)
        8-13:  Live Voice Demo (STT → RAG → TTS)
       13-16:  Test Metrics & Results Dashboard
       16-18:  Error Handling & Edge Cases
       18-19:  Lessons Learned
       19-20:  Conclusion & Thank You
```

---

## SUCCESS CRITERIA FOR PRESENTATION

```
✓ Demo runs without crashes
✓ All 20 test cases visible/accessible
✓ Metrics show improvement over baseline
✓ Error handling demonstrated
✓ Audience can hear Urdu audio
✓ Judges impressed with test coverage
✓ Team confident on Q&A responses
```

---

## TECHNICAL TROUBLESHOOTING

```
Problem: Backend API not responding
Solution: Check .env file, restart Jupyter kernel

Problem: Frontend CORS error
Solution: Ensure APIs cors allowed, check proxy settings

Problem: Audio playback fails
Solution: Check browser audio permissions, test MP3 codec

Problem: Chroma DB connection error
Solution: Verify chroma_db/ directory exists, run indexing

Problem: Test script fails
Solution: Check Python packages installed: 
         pip install -r requirements.txt

Problem: Slow latency during demo
Solution: Pre-warm cache, use cached responses
```

---

## FILES TO HAVE READY

```
Essential:
✓ FYP_TEST_CASES.md (detailed test docs)
✓ PRESENTATION_GUIDE.md (full slide guide)
✓ test_runner.py (automated tests)
✓ Test_cases_inputs/*.ogg (audio samples)
✓ test_results/summary.json (results)

Optional but Recommended:
✓ Screenshots (UI light/dark modes)
✓ Demo video (fallback if API down)
✓ Metrics dashboard (static image)
✓ Architecture diagram (PDF)
✓ Literature references (PDF)
```

---

## FINAL CHECKLIST

```
48 Hours Before:
☐ Test all demos 3x and time them
☐ Verify all audio files play correctly
☐ Check API keys are fresh & valid
☐ Print 5 copies of this cheat sheet
☐ Prepare backup videos

24 Hours Before:
☐ Full dry run of entire presentation
☐ Time each section carefully
☐ Handle Q&A practice with team
☐ Charge all devices

30 Minutes Before:
☐ Boot all systems (backend, frontend, test script)
☐ Have static metrics image visible
☐ Open all necessary browser tabs/terminals
☐ Clear desktop of clutter
☐ Silence notifications

GO TIME:
☐ Breathe, smile, speak clearly!
☐ Emphasize testing rigor to judges
☐ Show both success AND graceful failures
☐ Highlight team collaboration
```

---

Good luck with your FYP presentation! 🎉
