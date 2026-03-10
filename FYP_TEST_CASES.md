# Mahir on Call - FYP Test Cases & Evaluation

## Project Overview
**Mahir on Call** is an Urdu-based voice assistant for FAST-NUCES front desk. The system processes voice queries in Urdu, retrieves relevant information using RAG, and responds with synthesized Urdu audio.

**Technology Stack:**
- Frontend: React + Vite
- Backend: Python (OpenAI, LangChain, Chroma DB)
- Speech Processing: Whisper (STT), gTTS & ElevenLabs (TTS)
- RAG Framework: LangChain + Chroma Vector DB

---

## Test Cases (20 Total)

### **Category 1: UI/UX Testing (3 Test Cases)**

#### TC-01: Voice Recording UI Interaction
**Objective:** Verify the voice card UI responds correctly to user interactions
- **Steps:**
  1. Load the application
  2. Navigate to "Voice Section"
  3. Click the circular microphone button
  4. Verify button changes to "processing" state with spinner
  5. Click "Stop" to stop recording
- **Expected Result:** 
  - Button visual state changes appropriately
  - Microphone icon displays while idle
  - Spinner animates during processing
  - Status transitions are smooth
- **Pass Criteria:** All UI state transitions occur without errors
- **Effort:** 5 minutes

---

#### TC-02: Theme Toggle Functionality
**Objective:** Verify light/dark theme switching works correctly
- **Steps:**
  1. Load application in light theme
  2. Navigate to Navbar
  3. Click theme toggle button
  4. Verify all components switch to dark theme
  5. Check contrast ratios for accessibility
  6. Switch back to light theme
- **Expected Result:**
  - Theme changes immediately across all pages
  - Colors properly inverted
  - All text remains readable
  - Persistent theme preference
- **Pass Criteria:** No visual bugs, WCAG AA contrast compliance
- **Effort:** 10 minutes

---

#### TC-03: Message Display & Transcript Rendering
**Objective:** Verify conversation history displays correctly
- **Steps:**
  1. Complete a voice query successfully
  2. Verify user query appears in transcript
  3. Verify bot response displays
  4. Verify audio player controls appear for response
  5. Test "New Query" button
- **Expected Result:**
  - User message labels with "You:"
  - Bot messages label with "Mahir:"
  - Messages display in chronological order
  - Audio controls are functional
  - "New Query" resets conversation
- **Pass Criteria:** All UI elements render correctly
- **Effort:** 8 minutes

---

### **Category 2: Speech-to-Text (Whisper) Testing (3 Test Cases)**

#### TC-04: Whisper Transcription - Clear Urdu Audio
**Objective:** Verify Whisper correctly transcribes clear Urdu speech
- **Test Audio:** Male voice asking "FAST Peshawar main kitnay hostel hain?" (How many hostels in FAST Peshawar?)
- **Expected Transcription:** Close to exact Urdu script
- **Steps:**
  1. Upload test audio file
  2. Run transcription pipeline
  3. Capture output text
  4. Compare with reference transcription
- **Pass Criteria:** Accuracy > 85%, no missing words
- **Accuracy Metrics:**
  - Word Error Rate (WER) < 15%
  - Character Error Rate (CER) < 10%
- **Effort:** 5 minutes

---

#### TC-05: Whisper Transcription - Noisy/Accented Audio
**Objective:** Verify Whisper handles background noise and regional accents
- **Test Audio:** Background noise (20-30dB), Pakhtun accent Urdu
- **Question:** "Dar ul Baraka mein scholarship kya hain?" (What scholarships are available?)
- **Expected Result:** Intelligible transcription despite noise
- **Steps:**
  1. Process audio with background noise
  2. Record transcription output
  3. Calculate WER
  4. Assess intelligibility
- **Pass Criteria:** WER < 25%, meaning remains clear
- **Effort:** 6 minutes

---

#### TC-06: Whisper - Code Switching (Urdu + English)
**Objective:** Test Whisper with mixed Urdu and English code-switching
- **Test Audio:** "FAST ke liye scholarship apply karny ke liye kya requirements hain jo international students ke liye available ho?"
- **Expected:** Mixed Urdu+English transcription
- **Steps:**
  1. Create test audio with code-switching
  2. Transcribe
  3. Verify both languages detected correctly
- **Pass Criteria:** Both Urdu and English words transcribed accurately
- **Effort:** 7 minutes

---

### **Category 3: RAG System Testing (4 Test Cases)**

#### TC-07: RAG Query - Information Available in KB
**Objective:** Verify RAG retrieves relevant documents when information exists
- **Query (Roman-Urdu):** "Tuition fee ke liye monthly installments possible hain kya?"
- **Expected Behavior:**
  - Chroma retrieves relevant documents about fee payment options
  - At least 5 relevant documents in top-k results
  - GPT generates contextually appropriate response
- **Steps:**
  1. Query RAG system
  2. Capture retrieved documents
  3. Verify document relevance
  4. Validate generated response accuracy
- **Pass Criteria:** 
  - Similarity score > 0.7 for top results
  - Response includes factual info from KB
  - No hallucinated information
- **Metrics:**
  - Retrieval Precision@5 > 80%
  - Response relevance score > 4/5
- **Effort:** 10 minutes

---

#### TC-08: RAG Query - Information NOT Available in KB
**Objective:** Verify RAG gracefully handles out-of-KB queries
- **Query (Roman-Urdu):** "FAST mein kya drone program hai?" (Does FAST have a drone program?)
- **Expected Behavior:**
  - System retrieves least relevant documents (similarity < 0.5)
  - GPT explicitly states insufficient information
  - No hallucinated answers generated
- **Steps:**
  1. Query with out-of-scope question
  2. Capture response
  3. Verify it says "I don't have this information"
  4. Check for hallucinations
- **Pass Criteria:** 
  - Clear message about unavailable info
  - Zero hallucinations
  - Professional tone maintained
- **Metrics:**
  - False positive rate < 5%
- **Effort:** 8 minutes

---

#### TC-09: RAG Retrieval - Query Expansion & Synonym Handling
**Objective:** Test if RAG finds info despite paraphrasing/synonyms
- **Query Variations:**
  - "Fees ke barey mein batao" (Tell about fees)
  - "Tuition cost kitni hai?" (What's tuition cost?)
  - "Fee structure share karo" (Share fee structure)
- **Expected:** All variations retrieve fee-related documents
- **Steps:**
  1. Query with variation 1
  2. Check retrieved documents
  3. Repeat with variations 2 & 3
  4. Compare retrieval consistency
- **Pass Criteria:** 
  - ≥80% overlap in retrieved docs across queries
  - Top document relevant in all cases
- **Effort:** 12 minutes

---

#### TC-10: RAG Multi-turn Conversation
**Objective:** Verify RAG maintains context across multiple queries
- **Conversation Flow:**
  1. Q1: "Undergraduate programs mein kya options hain?" (What undergrad programs?)
  2. Q2: "CS program ke liye entry requirements kya hain?" (CS entry requirements?)
  3. Q3: "CS program ke liye fees kitni hain?" (CS program cost?)
- **Expected:** 
  - Each answer is contextually appropriate
  - No repetition of previous answers
  - Context flows naturally
- **Pass Criteria:** 
  - All 3 responses factually accurate
  - Clear progression in conversation
- **Effort:** 10 minutes

---

### **Category 4: Text-to-Speech Testing (4 Test Cases)**

#### TC-11: gTTS - Urdu Script to Speech
**Objective:** Verify gTTS generates intelligible Urdu audio
- **Input Text (Urdu):** "FAST-NUCES میں انجینئرنگ کے لیے داخلہ کے شرائط یہ ہیں"
- **Expected:** Clear, natural Urdu speech output
- **Steps:**
  1. Pass Urdu text to gTTS
  2. Generate MP3 audio
  3. Listen and assess quality
- **Pass Criteria:**
  - Audio is intelligible
  - No robotic/unnatural tone
  - Proper pronunciation of Urdu words
- **Quality Metrics:**
  - MOS (Mean Opinion Score) > 3.5/5
  - No distortion
- **Effort:** 5 minutes

---

#### TC-12: ElevenLabs - Female Voice with Calm Tone
**Objective:** Verify ElevenLabs produces female voice (requirement met)
- **Input Text:** "Scholarship Kay liye apply karne ka process batate hain"
- **Expected:** 
  - Female voice (previously was male)
  - Calm, professional tone
  - Natural-sounding speech
- **Steps:**
  1. Trigger ElevenLabs pipeline
  2. Set voice gender preference to female
  3. Generate audio with selected voice
  4. Validate it's female voice
  5. Assess calm tone
- **Pass Criteria:**
  - Audio is clearly female voice
  - Professional, calm delivery
  - No voice artifacts
- **Effort:** 8 minutes

---

#### TC-13: gTTS Number Handling
**Objective:** Verify gTTS/ElevenLabs correctly pronounce numbers as words
- **Test Cases:**
  - "Fee 11000 rupees hai" → should say "eleven thousand"
  - "2024 mail intake ke liye" → should say "twenty twenty twenty four"
  - "Scholarship 50% tak available hai" → should pronounce "fifty percent"
- **Steps:**
  1. Test each case
  2. Verify number pronunciation
  3. Check for digit-by-digit reading errors
- **Pass Criteria:** Numbers pronounced as complete words, not individual digits
- **Effort:** 7 minutes

---

#### TC-14: TTS Error Handling - Unsupported Characters
**Objective:** Verify TTS handles special characters gracefully
- **Input:** "Admission@2024! Aao mil kar #FAST explore karo??"
- **Expected:** 
  - Special characters handled gracefully
  - No crash/error
  - Text normalized appropriately
- **Steps:**
  1. Pass text with special chars
  2. Check for exceptions
  3. Listen to output
- **Pass Criteria:** 
  - No application crash
  - Audio still intelligible
  - Characters properly filtered/handled
- **Effort:** 6 minutes

---

### **Category 5: End-to-End Pipeline Testing (3 Test Cases)**

#### TC-15: Complete E2E Pipeline - HAD + RAG + STT + TTS
**Objective:** Full system integration test
- **Scenario:** User asks: "Scholarship ke bare mein batao" (Tell me about scholarships)
- **Flow:**
  1. Record Urdu voice input (TC-04 test audio)
  2. Whisper STT → Transcription
  3. Urdu→Roman conversion → "Scholarship ke bare mein batao"
  4. RAG retrieval → Get scholarship docs
  5. GPT generation → Answer in Urdu
  6. Urdu→Roman extraction
  7. ElevenLabs TTS → Audio response
- **Expected:**
  - Complete flow succeeds
  - Response is accurate and complete
  - Audio is clear and professional
- **Pass Criteria:**
  - All pipeline stages succeed
  - End-to-end time < 15 seconds
  - Response contains at least 200 words of info
- **Metrics:**
  - Pipeline success rate: 100%
  - Latency breakdown captured
- **Effort:** 20 minutes (includes setup)

---

#### TC-16: E2E Pipeline - Information Not Found Scenario
**Objective:** Verify graceful degradation when RAG has no info
- **Scenario:** Query about non-existent program: "FAST mein Quantum Computing program hai?"
- **Expected Flow:**
  1. STT succeeds
  2. RAG retrieves low-relevance docs
  3. GPT detects insufficient info
  4. System responds: "Maafi chahta hoon, is barey mein mujhe jankari nahi hai"
  5. TTS generates appropriate response
- **Pass Criteria:**
  - All stages succeed
  - No hallucination in response
  - User notified clearly about unavailable info
- **Effort:** 15 minutes

---

#### TC-17: Performance Under Load - Concurrent Queries
**Objective:** Test system stability with multiple simultaneous queries
- **Setup:** Simulate 5 concurrent voice queries
- **Queries:**
  1. Fee query
  2. Admission query
  3. Scholarship query
  4. Program query
  5. Hostel query
- **Expected:**
  - All queries processed successfully
  - Response time < 20 seconds per query
  - No queue overflow
- **Pass Criteria:**
  - 100% success rate for all queries
  - P95 latency < 25 seconds
  - Zero failure/timeout errors
- **Metrics:**
  - Throughput: ≥ 4 queries/minute
  - Average latency: < 18 seconds
  - Error rate: 0%
- **Effort:** 25 minutes

---

### **Category 6: Error Handling & Edge Cases (3 Test Cases)**

#### TC-18: Silent Audio Input Handling
**Objective:** Verify system handles empty/silent voice input gracefully
- **Test Audio:** 3 seconds of silence (or < 20dB ambient noise)
- **Steps:**
  1. Record/upload silent audio
  2. Process through pipeline
  3. Check for error handling
- **Expected:**
  - Whisper returns empty or minimal text
  - System detects "no speech detected"
  - User-friendly error message: "Kuch suna nahi gaya, dobara try karein"
  - Application doesn't crash
- **Pass Criteria:**
  - Graceful error message shown
  - No application crash
  - Allows user to retry
- **Effort:** 8 minutes

---

#### TC-19: Extremely Long Query (Stress Test)
**Objective:** Test system handles very long queries
- **Input:** 60-second Urdu voice query
- **Steps:**
  1. Record/provide 60-second query
  2. Process through full pipeline
  3. Monitor system resources
  4. Check response generation time
- **Expected:**
  - STT processes full audio
  - RAG retrieval completes
  - Response generated (may be summarized)
- **Pass Criteria:**
  - Processing completes < 60 seconds
  - No memory overflow
  - Response quality maintained
- **Metrics:**
  - Peak memory usage < 500MB
  - Processing time < 45 seconds
- **Effort:** 12 minutes

---

#### TC-20: Rapid Sequential Queries (User Impatience)
**Objective:** Test behavior with rapid successive queries
- **Scenario:** User clicks microphone button 5 times in 2 seconds
- **Steps:**
  1. Attempt to start recording 5 times rapidly
  2. Observe system behavior
- **Expected:**
  - System ignores/debounces rapid clicks
  - Only one recording session active
  - Clear UI feedback about current state
  - No data corruption
- **Pass Criteria:**
  - No errors/exceptions
  - Debouncing works correctly
  - Single clean recording initiated
- **Effort:** 8 minutes

---

## Summary Table

| TC ID | Category | Test Name | Priority | Estimated Time | Status |
|-------|----------|-----------|----------|-----------------|--------|
| TC-01 | UI | Voice Recording UI | HIGH | 5 min | ☐ |
| TC-02 | UI | Theme Toggle | MEDIUM | 10 min | ☐ |
| TC-03 | UI | Message Display | HIGH | 8 min | ☐ |
| TC-04 | STT | Clear Audio | HIGH | 5 min | ☐ |
| TC-05 | STT | Noisy Audio | MEDIUM | 6 min | ☐ |
| TC-06 | STT | Code-Switching | MEDIUM | 7 min | ☐ |
| TC-07 | RAG | Info Available | HIGH | 10 min | ☐ |
| TC-08 | RAG | Info Not Available | HIGH | 8 min | ☐ |
| TC-09 | RAG | Query Expansion | MEDIUM | 12 min | ☐ |
| TC-10 | RAG | Multi-turn | MEDIUM | 10 min | ☐ |
| TC-11 | TTS | gTTS Urdu | HIGH | 5 min | ☐ |
| TC-12 | TTS | ElevenLabs Female | HIGH | 8 min | ☐ |
| TC-13 | TTS | Number Handling | MEDIUM | 7 min | ☐ |
| TC-14 | TTS | Special Characters | LOW | 6 min | ☐ |
| TC-15 | E2E | Full Pipeline | HIGH | 20 min | ☐ |
| TC-16 | E2E | No-Info Graceful | HIGH | 15 min | ☐ |
| TC-17 | E2E | Concurrent Load | MEDIUM | 25 min | ☐ |
| TC-18 | Error | Silent Input | MEDIUM | 8 min | ☐ |
| TC-19 | Error | Long Query | MEDIUM | 12 min | ☐ |
| TC-20 | Error | Rapid Queries | LOW | 8 min | ☐ |

**Total Estimated Time:** ~180 minutes (~3 hours)

---

## Key Metrics for FYP Evaluation

### Speech Recognition (Whisper)
- **Word Error Rate (WER):** < 15% for clear audio, < 25% for noisy
- **Character Error Rate (CER):** < 10% for clear audio
- **Language Detection Accuracy:** > 95%

### RAG System
- **Retrieval Precision@5:** > 80%
- **Retrieval Recall:** > 75%
- **Hallucination Rate:** < 5%
- **Response Relevance:** > 4/5 (expert evaluation)

### Text-to-Speech
- **MOS (Mean Opinion Score):** > 3.5/5
- **Voice Gender Accuracy:** 100% (female voice achieved)
- **Number Pronunciation Accuracy:** 100%
- **Intelligibility Score:** > 95%

### System Performance
- **End-to-End Latency (P95):** < 25 seconds
- **Throughput:** ≥ 4 queries/minute
- **Error Rate:** < 2%
- **Availability:** > 99%

### User Experience
- **UI Responsiveness:** All interactions < 500ms
- **Message Display Latency:** < 1 second
- **Audio Playback Quality:** Zero artifacts
- **Theme Switch Latency:** < 300ms

---

## Testing Environment Setup

### Requirements
```bash
# Python packages
pip install openai langchain chromadb python-dotenv tiktoken elevenlabs gtts

# Audio test files (in Test_cases_inputs/)
- 15.ogg: FAST fees query
- 19.ogg: Scholarship query
- 22.ogg: Admission criteria query
- 3.ogg: Program information query
- etc.
```

### Configuration (.env)
```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk-...
ELEVENLABS_VOICE_ID=<female_calm_voice_id>
```

---

## Presentation Talking Points

1. **Comprehensive Testing:** 20 test cases covering UI, STT, RAG, TTS, and E2E scenarios
2. **Real-World Scenarios:** Tests include noisy audio, code-switching, out-of-KB queries
3. **Performance Validation:** Metrics for latency, throughput, and accuracy
4. **Quality Improvements:** Female voice (ElevenLabs), number normalization, graceful error handling
5. **User-Centric Design:** UI testing ensures smooth interaction, theme support for accessibility

---

## Execution Checklist

- [ ] Prepare test audio files (clear, noisy, code-switching variants)
- [ ] Create isolated test environment with fresh Chroma DB
- [ ] Document baseline metrics before presentation
- [ ] Run all HIGH priority tests first (TC-01, 03, 04, 07, 08, 11, 12, 15, 16)
- [ ] Capture screenshots/videos of UI interactions for demo
- [ ] Record audio samples for quality assessment
- [ ] Prepare metrics dashboard/report
- [ ] Brief team on test case explanations
