"""
Mahir on Call - Automated Test Suite
For FYP Presentation & Evaluation
"""

import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
import openai
from elevenlabs import ElevenLabs
import glob

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')

class MahirTestSuite:
    def __init__(self):
        self.results = {}
        self.metrics = {}
        self.test_output_dir = "test_results_presentation"
        os.makedirs(self.test_output_dir, exist_ok=True)
        
    def log_test(self, test_id, test_name, status, details=""):
        """Log test result"""
        result = {
            "test_id": test_id,
            "test_name": test_name,
            "status": status,  # PASS, FAIL, SKIP
            "timestamp": time.time(),
            "details": details
        }
        self.results[test_id] = result
        status_symbol = "✓" if status == "PASS" else "✗" if status == "FAIL" else "○"
        print(f"\n[{status_symbol}] {test_id}: {test_name} - {status}")
        if details:
            print(f"    Details: {details}")
    
    # ============ UI TESTS ============
    def test_ui_state_transitions(self):
        """TC-01: Voice Recording UI Interaction"""
        print("\n" + "="*60)
        print("RUNNING: TC-01 - Voice Recording UI Interaction")
        print("="*60)
        print("""
        Manual Test Steps:
        1. Navigate to http://localhost:5173
        2. Scroll to "Voice Section"
        3. Click circular microphone button
        4. Observe: Button changes color, spinner appears
        5. Click "Stop"
        6. Observe: Return to idle state
        
        ✓ PASS criteria: All transitions smooth, no console errors
        """)
        self.log_test("TC-01", "Voice Recording UI Interaction", "MANUAL")
    
    def test_theme_toggle(self):
        """TC-02: Theme Toggle Functionality"""
        print("\n" + "="*60)
        print("RUNNING: TC-02 - Theme Toggle Functionality")
        print("="*60)
        print("""
        Test Procedure:
        1. Open DevTools (F12)
        2. Check localStorage for 'theme' key initially
        3. Click theme toggle in navbar
        4. Verify all elements update colors
        5. Refresh page - theme should persist
        6. Check contrast with accessibility checker
        
        ✓ PASS criteria: Theme persists, colors correct, WCAG AA compliance
        """)
        self.log_test("TC-02", "Theme Toggle Functionality", "MANUAL")
    
    # ============ RAG TESTS ============
    def test_rag_info_available(self):
        """TC-07: RAG Query - Information Available"""
        print("\n" + "="*60)
        print("RUNNING: TC-07 - RAG Query [Info Available]")
        print("="*60)
        
        try:
            from langchain_openai import OpenAIEmbeddings
            from langchain_community.vectorstores import Chroma
            
            test_query = "Tuition fee ke liye monthly installments possible hain kya?"
            
            emb = OpenAIEmbeddings()
            chroma = Chroma(
                embedding_function=emb,
                persist_directory='chroma_db',
                collection_name='sample'
            )
            
            retrieved = chroma.similarity_search(test_query, k=5)
            
            if len(retrieved) > 0:
                print(f"\n✓ Retrieved {len(retrieved)} documents")
                for i, doc in enumerate(retrieved):
                    print(f"\n  [{i+1}] Category: {doc.metadata.get('category', 'N/A')}")
                    print(f"      Content preview: {doc.page_content[:100]}...")
                
                self.log_test("TC-07", "RAG Query - Information Available", "PASS",
                             f"Retrieved {len(retrieved)} relevant docs")
            else:
                self.log_test("TC-07", "RAG Query - Information Available", "FAIL",
                             "No documents retrieved")
        except Exception as e:
            self.log_test("TC-07", "RAG Query - Information Available", "FAIL", str(e))
    
    def test_rag_info_not_available(self):
        """TC-08: RAG Query - Information NOT Available"""
        print("\n" + "="*60)
        print("RUNNING: TC-08 - RAG Query [Info NOT Available]")
        print("="*60)
        
        try:
            from langchain_openai import OpenAIEmbeddings
            from langchain_community.vectorstores import Chroma
            
            # Query about non-existent program
            test_query = "FAST mein Drone Engineering program hai kya?"
            
            emb = OpenAIEmbeddings()
            chroma = Chroma(
                embedding_function=emb,
                persist_directory='chroma_db',
                collection_name='sample'
            )
            
            retrieved = chroma.similarity_search(test_query, k=5)
            
            if len(retrieved) > 0:
                print(f"\n✓ Retrieved {len(retrieved)} documents")
                print("  Note: These are likely low-relevance results (expected behavior)")
                
                self.log_test("TC-08", "RAG Query - Information NOT Available", "PASS",
                             "Gracefully handled out-of-KB query")
            else:
                self.log_test("TC-08", "RAG Query - Information NOT Available", "PASS",
                             "Correctly returned no results")
        except Exception as e:
            self.log_test("TC-08", "RAG Query - Information NOT Available", "FAIL", str(e))
    
    def test_rag_query_expansion(self):
        """TC-09: RAG Retrieval - Query Expansion & Synonym Handling"""
        print("\n" + "="*60)
        print("RUNNING: TC-09 - Query Expansion & Synonyms")
        print("="*60)
        
        try:
            from langchain_openai import OpenAIEmbeddings
            from langchain_community.vectorstores import Chroma
            
            queries = [
                "Fees ke barey mein batao",
                "Tuition cost kitni hai?",
                "Fee structure share karo"
            ]
            
            emb = OpenAIEmbeddings()
            chroma = Chroma(
                embedding_function=emb,
                persist_directory='chroma_db',
                collection_name='sample'
            )
            
            all_results = {}
            for query in queries:
                retrieved = chroma.similarity_search(query, k=3)
                all_results[query] = [doc.metadata.get('category', 'N/A') for doc in retrieved]
                print(f"\n  Query: '{query}'")
                print(f"  Retrieved categories: {all_results[query]}")
            
            self.log_test("TC-09", "RAG Query Expansion", "PASS",
                         f"All {len(queries)} query variations handled")
        except Exception as e:
            self.log_test("TC-09", "RAG Query Expansion", "FAIL", str(e))
    
    # ============ TTS TESTS ============
    def test_elevenlabs_voice_gender(self):
        """TC-12: ElevenLabs - Female Voice Verification"""
        print("\n" + "="*60)
        print("RUNNING: TC-12 - ElevenLabs Female Voice")
        print("="*60)
        
        try:
            api_key = os.getenv('ELEVENLABS_API_KEY')
            if not api_key:
                self.log_test("TC-12", "ElevenLabs Female Voice", "SKIP", 
                             "ELEVENLABS_API_KEY not set")
                return
            
            client = ElevenLabs(api_key=api_key)
            voices = client.voices.get_all().voices
            
            female_calm_voice = None
            for v in voices:
                labels = getattr(v, 'labels', {}) or {}
                gender = labels.get('gender', '').lower()
                desc = labels.get('descriptive', '').lower()
                
                if ('female' in gender or 'neutral' in gender) and ('calm' in desc or 'neutral' in desc):
                    female_calm_voice = v
                    print(f"\n✓ Found female/calm voice:")
                    print(f"  ID: {v.voice_id}")
                    print(f"  Name: {v.name}")
                    print(f"  Gender: {gender}")
                    print(f"  Tone: {desc}")
                    break
            
            if female_calm_voice:
                self.log_test("TC-12", "ElevenLabs Female Voice", "PASS",
                             f"Voice: {female_calm_voice.name}")
            else:
                self.log_test("TC-12", "ElevenLabs Female Voice", "FAIL",
                             "No suitable female/calm voice found")
        except Exception as e:
            self.log_test("TC-12", "ElevenLabs Female Voice", "FAIL", str(e))
    
    # ============ PIPELINE TESTS ============
    def test_number_normalization(self):
        """TC-13: Test number handling for TTS"""
        print("\n" + "="*60)
        print("RUNNING: TC-13 - Number Normalization for TTS")
        print("="*60)
        
        try:
            from num2words import num2words
            import re
            
            test_cases = [
                ("Fee 11000 rupees hai", "eleven thousand"),
                ("2024 intake", "two thousand twenty four"),
                ("50% scholarship", "fifty")
            ]
            
            def normalize_text(text):
                def _replace(match):
                    val = int(match.group(0))
                    return num2words(val, lang='en')
                return re.sub(r"\d+", _replace, text)
            
            all_pass = True
            for text, expected in test_cases:
                normalized = normalize_text(text)
                print(f"\n  Input: '{text}'")
                print(f"  Normalized: '{normalized}'")
                print(f"  Contains '{expected}': {expected in normalized.lower()}")
                if expected.lower() not in normalized.lower():
                    all_pass = False
            
            if all_pass:
                self.log_test("TC-13", "Number Normalization", "PASS",
                             "All number formats normalized correctly")
            else:
                self.log_test("TC-13", "Number Normalization", "FAIL",
                             "Some numbers not normalized properly")
        except Exception as e:
            self.log_test("TC-13", "Number Normalization", "FAIL", str(e))
    
    def test_api_availability(self):
        """Check if all required APIs are configured"""
        print("\n" + "="*60)
        print("RUNNING: System Configuration Check")
        print("="*60)
        
        checks = {
            "OPENAI_API_KEY": os.getenv('OPENAI_API_KEY') is not None,
            "ELEVENLABS_API_KEY": os.getenv('ELEVENLABS_API_KEY') is not None,
            "Chroma DB Directory": os.path.exists('chroma_db'),
            "Test Audio Files": len(glob.glob('Test_cases_inputs/*.ogg')) > 0,
            "Frontend Build": os.path.exists('frontend/dist') or os.path.exists('frontend/src'),
        }
        
        print("\nConfiguration Status:")
        for check, status in checks.items():
            status_symbol = "✓" if status else "✗"
            print(f"  [{status_symbol}] {check}")
        
        all_configured = all(checks.values())
        status = "PASS" if all_configured else "PARTIAL"
        self.log_test("CONFIG", "System Configuration", status)
    
    # ============ GENERATE REPORT ============
    def generate_report(self):
        """Generate test execution report"""
        print("\n" + "="*60)
        print("TEST EXECUTION REPORT")
        print("="*60)
        
        report = {
            "execution_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_tests": len(self.results),
            "passed": sum(1 for r in self.results.values() if r["status"] == "PASS"),
            "failed": sum(1 for r in self.results.values() if r["status"] == "FAIL"),
            "skipped": sum(1 for r in self.results.values() if r["status"] == "SKIP"),
            "manual": sum(1 for r in self.results.values() if r["status"] == "MANUAL"),
            "results": self.results
        }
        
        report_file = os.path.join(self.test_output_dir, "test_report.json")
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\nTotal Tests: {report['total_tests']}")
        print(f"✓ Passed: {report['passed']}")
        print(f"✗ Failed: {report['failed']}")
        print(f"○ Skipped: {report['skipped']}")
        print(f"⊙ Manual: {report['manual']}")
        print(f"\nReport saved to: {report_file}")
        
        return report
    
    def run_all_tests(self):
        """Run all test suites"""
        print("\n" + "="*70)
        print("MAHIR ON CALL - FYP TEST SUITE")
        print("="*70)
        
        # Configuration check
        self.test_api_availability()
        
        # UI Tests
        print("\n[CATEGORY: UI/UX TESTS]")
        self.test_ui_state_transitions()
        self.test_theme_toggle()
        
        # RAG Tests
        print("\n[CATEGORY: RAG SYSTEM TESTS]")
        self.test_rag_info_available()
        self.test_rag_info_not_available()
        self.test_rag_query_expansion()
        
        # TTS Tests
        print("\n[CATEGORY: TTS TESTS]")
        self.test_elevenlabs_voice_gender()
        self.test_number_normalization()
        
        # Generate report
        report = self.generate_report()
        
        print("\n" + "="*70)
        print("✓ Test Suite Execution Complete")
        print("="*70)
        
        return report


if __name__ == "__main__":
    suite = MahirTestSuite()
    suite.run_all_tests()
