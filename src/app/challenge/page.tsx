"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Mic, Headphones, Turtle, Send, Skull, ShieldAlert, Sparkles, BookOpen, MessageCircle, Hourglass, Award, Swords, Timer } from "lucide-react";
import { playClick, playSuccess, playError, playCombo, toggleAmbientHum } from "@/lib/sfx";
import { saveLocal, getLocal, StorageKeys } from "@/lib/storage";
import OracleChat from "@/components/OracleChat";
import ShareCard from "@/components/ShareCard";

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

interface Word { id: number; word: string; translation: string; phonetic: string | null; rank: number; sentenceEn: string; sentencePt: string; }
interface CardItem { id: string; wordId: number; content: string; type: "en" | "pt"; }

function ChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReviewMode = searchParams.get("mode") === "review";

  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<Word[]>([]);
  const [currentDate, setCurrentDate] = useState(() => getLocalDateString());
  const [difficulty, setDifficulty] = useState("APRENDIZ");
  
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [wordId: number]: boolean }>({});
  
  const [combo, setCombo] = useState(0);
  const [showComboAnim, setShowComboAnim] = useState(false);

  // Phase 3 Minigames State
  const [advTimer, setAdvTimer] = useState(5);
  const [mestreBlocks, setMestreBlocks] = useState<string[]>([]);
  const [mestreSelected, setMestreSelected] = useState<string[]>([]);
  const [anagramWord, setAnagramWord] = useState<string>("");

  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [shake, setShake] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");

  const activeWord = words[currentWordIndex];
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [audioLoading, setAudioLoading] = useState(false);
  const startTimeRef = useRef<number>(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showOracle, setShowOracle] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Phase 6 Mestre Reading State
  const [readingData, setReadingData] = useState<{text: string, question: string, options: string[], correctOptionIndex: number} | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState(false);
  
  const mcOptions = useMemo(() => {
    if (words.length === 0 || phase !== 1) return [];
    const activeWord = words[currentWordIndex];
    if (!activeWord) return [];
    const otherTranslations = words.filter((w) => w.id !== activeWord.id).map((w) => w.translation);
    const distractors = shuffleArray(otherTranslations).slice(0, 3);
    return shuffleArray([...distractors, activeWord.translation]);
  }, [phase, currentWordIndex, words]);

  const memoryCards = useMemo(() => {
    if (words.length === 0 || phase !== 5) return [];
    const memoryWords = words.slice(16, 20);
    const enCards: CardItem[] = memoryWords.map((w) => ({ id: `en-${w.id}`, wordId: w.id, content: w.word, type: "en" }));
    const ptCards: CardItem[] = memoryWords.map((w) => ({ id: `pt-${w.id}`, wordId: w.id, content: w.translation, type: "pt" }));
    return shuffleArray([...enCards, ...ptCards]);
  }, [phase, words]);

  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedCardIds, setMatchedCardIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.getVoices();
    toggleAmbientHum(true);
    return () => toggleAmbientHum(false);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (!loading && !completed) {
      startTimeRef.current = Date.now() - timeSpent * 1000;
      timer = setInterval(() => setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    }
    return () => clearInterval(timer);
  }, [loading, completed, timeSpent]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const todayStr = getLocalDateString();
        setCurrentDate(todayStr); // Update to actual local date right now
        let url = `/api/session?date=${todayStr}`;
        if (isReviewMode) {
          url = `/api/review`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (!isReviewMode && data.session?.completed) {
          setCompleted(true);
          return;
        }

        if (data.words && data.words.length > 0) setWords(data.words);
        if (data.difficultyLevel) setDifficulty(data.difficultyLevel);
        setLoading(false);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error("Failed to load session", err);
        setLoading(false);
      }
    };
    loadSession();
  }, [isReviewMode]);

  useEffect(() => {
    if (loading || completed || words.length === 0) return;
    saveLocal(StorageKeys.CHALLENGE_PROGRESS, {
      date: currentDate,
      phase,
      currentWordIndex,
      answers,
      combo,
      timeSpent,
      completed: false
    });
  }, [phase, currentWordIndex, answers, combo, timeSpent, loading, completed, words.length, currentDate]);

  const sendAudioToWhisper = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");

      const response = await fetch("/api/speech", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await response.json();
      const speechText = data.text || "";
      
      const activeWord = words[currentWordIndex];
      if (!activeWord) return;
      const cleanSpeech = speechText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase().trim();
      const targetWord = activeWord.word.toLowerCase().trim();
      const distance = getLevenshteinDistance(cleanSpeech, targetWord);
      
      let maxErrors = 0;
      if (difficulty === "APRENDIZ" || difficulty === "INICIANTE") maxErrors = targetWord.length > 5 ? 2 : 1;
      else if (difficulty === "INTERMEDIARIO" || difficulty === "AVANCADO") maxErrors = targetWord.length > 5 ? 1 : 0;
      else if (difficulty === "MESTRE") maxErrors = 0;

      const isCorrect = distance <= maxErrors || cleanSpeech.includes(targetWord);
      triggerFeedback(isCorrect, activeWord.id);

    } catch (err) {
      console.error(err);
      setVoiceError("Erro ao processar áudio no servidor.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const startRecording = async () => {
    if (!voiceSupported) return;
    playClick();
    setVoiceError(null);
    
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        sendAudioToWhisper(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setIsRecording(false);
      if (err.name === "NotAllowedError") {
        setVoiceError("Microfone bloqueado. Alternando para digitação mágica.");
      } else if (err.name === "NotFoundError") {
        setVoiceError("Microfone não encontrado. Alternando para digitação.");
      } else {
        setVoiceError("Erro no microfone. Alternando para digitação.");
      }
      setShowManualInput(true);
    }
  };

  const playAudio = async (text: string, rate = 1) => {
    if (typeof window === "undefined") return;
    setAudioLoading(true);
    
    // Sempre usar a API de TTS do Google para garantir a pronúncia perfeita
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = rate;
      audio.onended = () => setAudioLoading(false);
      audio.onerror = () => setAudioLoading(false);
      await audio.play();
    } catch (e) {
      setAudioLoading(false);
    }
  };

  const advanceChallenge = () => {
    setFeedback(null); setTypedAnswer(""); setShowManualInput(false); setVoiceError(null);
    if (phase < 5) {
      const activePhaseLimit = phase * 4 - 1;
      if (currentWordIndex < activePhaseLimit) setCurrentWordIndex((prev) => prev + 1);
      else { setPhase((prev) => (prev + 1) as any); setCurrentWordIndex((prev) => prev + 1); }
    } else if (phase === 5 && difficulty === "MESTRE") {
        setPhase(6);
        loadReadingExercise();
    } else {
        finishGame();
    }
  };

  const loadReadingExercise = async () => {
    setReadingLoading(true); setReadingError(false);
    try {
      const response = await fetch("/api/reading", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: words.map(w => w.word) })
      });
      const data = await response.json();
      if (data.text) setReadingData(data);
      else setReadingError(true);
    } catch {
      setReadingError(true);
    }
    setReadingLoading(false);
  };

  const triggerFeedback = (isCorrect: boolean, wordId: number) => {
    const activeWord = words[currentWordIndex];
    if (!activeWord) return;

    setAnswers((prev) => ({ ...prev, [wordId]: isCorrect }));

    if (isCorrect) {
      playSuccess();
      setFeedback("correct");
      setCombo(c => c + 1);
      if (combo > 0) {
        playCombo();
        setShowComboAnim(true);
        setTimeout(() => setShowComboAnim(false), 1000);
      }
      playAudio(activeWord.word);
      setTimeout(() => advanceChallenge(), 1500);
    } else {
      playError();
      setFeedback("incorrect");
      setCombo(0);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setTimeout(() => advanceChallenge(), 2000);
    }
  };

  // Setup Phase 3 states when word changes or phase changes
  useEffect(() => {
    if (phase === 3 && activeWord) {
      if (difficulty === "APRENDIZ") {
        const letters = activeWord.word.split("");
        setAnagramWord(shuffleArray(letters).join(" "));
      } else if (difficulty === "AVANCADO") {
        setAdvTimer(5);
        const t = setInterval(() => {
          setAdvTimer(prev => {
            if (prev <= 1) {
              clearInterval(t);
              if (!feedback) triggerFeedback(false, activeWord.id);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(t);
      } else if (difficulty === "MESTRE") {
        const wordsInSentence = activeWord.sentenceEn.split(" ").filter(w => w.trim());
        setMestreBlocks(shuffleArray(wordsInSentence));
        setMestreSelected([]);
      }
    }
  }, [phase, activeWord, difficulty]);

  const handleMestreSelect = (block: string, index: number) => {
    if (feedback) return;
    playClick();
    setMestreSelected(prev => [...prev, block]);
    setMestreBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleMestreSubmit = () => {
    if (feedback) return;
    const finalSentence = mestreSelected.join(" ");
    // Remove punctuation for comparison
    const cleanSent = finalSentence.replace(/[.,!?]/g, "").toLowerCase().trim();
    const cleanTarget = activeWord.sentenceEn.replace(/[.,!?]/g, "").toLowerCase().trim();
    triggerFeedback(cleanSent === cleanTarget, activeWord.id);
  };

  const handleMultipleChoiceSelect = (selectedOption: string) => {
    if (feedback) return;
    playClick();
    triggerFeedback(selectedOption === words[currentWordIndex].translation, words[currentWordIndex].id);
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback) return;
    playClick();
    const isCorrect = typedAnswer.toLowerCase().trim() === words[currentWordIndex].word.toLowerCase().trim();
    triggerFeedback(isCorrect, words[currentWordIndex].id);
  };

  const handleCardClick = (cardIndex: number) => {
    const clickedCard = memoryCards[cardIndex];
    if (!clickedCard || selectedCards.length >= 2 || selectedCards.includes(cardIndex) || matchedCardIds.includes(clickedCard.wordId)) return;
    playClick();

    const newSelected = [...selectedCards, cardIndex];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const first = memoryCards[newSelected[0]];
      const second = memoryCards[newSelected[1]];

      if (first.wordId === second.wordId && first.type !== second.type) {
        setAnswers((prev) => ({ ...prev, [first.wordId]: true }));
        setMatchedCardIds((prev) => [...prev, first.wordId]);
        setCombo(c => c + 1);
        setSelectedCards([]);
        playSuccess();
        playAudio(words.find((w) => w.id === first.wordId)?.word || "");
        if (matchedCardIds.length + 1 === 4) {
           setTimeout(() => advanceChallenge(), 1500);
        }
      } else {
        const affectedIds = [first.wordId, second.wordId];
        setAnswers((prev) => {
          const next = { ...prev };
          affectedIds.forEach((id) => { if (next[id] === undefined) next[id] = false; });
          return next;
        });
        setCombo(0);
        playError();
        setTimeout(() => setSelectedCards([]), 1200);
      }
    }
  };

  const finishGame = async () => {
    setCompleted(true);
    setLoading(true);

    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#d4af37', '#ffffff', '#aa8620'] });
    playCombo();

    const correctCount = Object.values(answers).filter(Boolean).length;
    const score = Math.max(100, 500 + (correctCount * 50) + (combo * 20) - (timeSpent * 2));
    setFinalScore(score);

    if (isReviewMode) {
        setCompleted(true);
        setLoading(false);
        return;
    }

    try {
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: currentDate, timeSpent, score, wordResults: answers }),
      });
      const cachedSession = getLocal<any>(StorageKeys.DAILY_SESSION);
      if (cachedSession) {
          cachedSession.session = { ...cachedSession.session, completed: true, score };
          saveLocal(StorageKeys.DAILY_SESSION, cachedSession);
      }
      
      const wrongWords = words.filter(w => answers[w.id] === false).map(w => w.word);
      localStorage.setItem("DAILY_WRONG_WORDS", JSON.stringify(wrongWords));
      
    } catch (err) { alert("Erro de conexão."); router.push("/"); }
    setLoading(false);
  };

  const jumpToPhase = (p: 1|2|3|4|5) => {
    playClick(); setFeedback(null); setTypedAnswer(""); setSelectedCards([]); setMatchedCardIds([]);
    setPhase(p); setCurrentWordIndex((p - 1) * 4);
  };

  if (loading && !completed) {
    return (
      <main className="container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div className="grimoire-book" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ textAlign: 'center', maxWidth: '400px' }}>
          <Sparkles size={64} color="var(--gold)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: 'var(--leather)', marginBottom: '0.5rem' }}>Invocando...</h2>
        </motion.div>
      </main>
    );
  }

  if (completed) {
    let correctCount = Object.values(answers).filter(Boolean).length;
    let wrongWords = words.filter(w => answers[w.id] === false).map(w => w.word);

    // Se o state 'answers' estiver vazio (ex: recarregou a página após completar),
    // vamos tentar recuperar os erros salvos no localStorage
    if (Object.keys(answers).length === 0) {
      try {
        const storedWrong = localStorage.getItem("DAILY_WRONG_WORDS");
        if (storedWrong) {
          wrongWords = JSON.parse(storedWrong);
          correctCount = 20 - wrongWords.length; // Estimativa simples se não tiver answers
        }
      } catch (e) {}
    }

    if (showOracle) {
      return (
        <main className="container" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <OracleChat wrongWords={wrongWords} onClose={() => setShowOracle(false)} />
        </main>
      );
    }

    if (showShare) {
      return (
        <ShareCard
          streak={getLocal<any>(StorageKeys.STREAK)?.currentStreak || 0}
          masteredWords={getLocal<any>(StorageKeys.PROGRESS)?.masteredWords || 0}
          difficultyLevel={difficulty}
          onClose={() => setShowShare(false)}
        />
      );
    }

    return (
      <main className="container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div className="grimoire-book" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }} style={{ textAlign: 'center', maxWidth: '550px' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><Award size={64} color="var(--gold)" /></div>
          <h1 style={{ color: 'var(--leather)', marginBottom: '1rem' }}>
            {isReviewMode ? 'Treino Concluído' : 'Sessão Finalizada'}
          </h1>
          <div className="stats-grid" style={{ margin: '2rem 0' }}>
            <div className="stat-box"><span className="stat-label">Precisão</span><span className="stat-value">{correctCount}/20</span></div>
            {!isReviewMode && (
              <div className="stat-box"><span className="stat-label">Pontos (Ouro)</span><span className="stat-value" style={{ color: 'var(--gold-dark)' }}>+{finalScore}</span></div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isReviewMode && (
              <>
                <button onClick={() => setShowShare(true)} className="btn-outline">
                  <Award size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                  Compartilhar Grimório Diário
                </button>
                <button onClick={() => setShowOracle(true)} className="btn-outline">
                  <MessageCircle size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                  Análise do Oráculo
                </button>
              </>
            )}
            <button onClick={() => router.push("/")} className="btn-gold" style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }}>Retornar ao Grimório</button>
          </div>
        </motion.div>
      </main>
    );
  }

  const progressPercent = phase === 5 ? (matchedCardIds.length / 4) * 100 : (currentWordIndex / 20) * 100;
  
  let cardClass = "grimoire-book ";
  if (shake) cardClass += "shake-error ";
  if (feedback === "correct") cardClass += "success-glow ";

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <AnimatePresence>
        {showComboAnim && combo > 1 && (
          <motion.div 
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: [1.2, 1], opacity: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            className="combo-text active"
          >
            Combo x{combo}!
          </motion.div>
        )}
      </AnimatePresence>



      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink)', fontWeight: 600 }}>
          <span>Fase {phase}/{difficulty === "MESTRE" ? '6' : '5'} {isReviewMode && <span style={{marginLeft: 10, padding: '2px 8px', background: 'var(--gold)', color: '#000', borderRadius: 4, fontSize: '0.8rem'}}>Treino</span>}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gold)' }}><Hourglass size={18} /> {timeSpent}s</span>
        </div>
        <div className="progress-container"><motion.div className="progress-bar" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} /></div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeWord?.id || phase}
          className={cardClass} 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
        >
          {phase === 1 && activeWord && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><BookOpen size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Decifre o Encantamento</span>
              <h2 style={{ fontSize: '4rem', color: 'var(--leather)', margin: '1rem 0 0.5rem 0' }}>{activeWord.word}</h2>
              <p style={{ color: 'var(--ink)', fontStyle: 'italic', marginBottom: '3rem', fontSize: '1.2rem', fontFamily: 'serif' }}>{activeWord.phonetic || "/.../"}</p>
              
              {difficulty === "MESTRE" ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (feedback) return;
                  playClick();
                  const isCorrect = typedAnswer.toLowerCase().trim() === activeWord.translation.toLowerCase().trim();
                  triggerFeedback(isCorrect, activeWord.id);
                }} style={{ maxWidth: '400px', margin: '0 auto' }}>
                  <input type="text" autoFocus value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} disabled={feedback !== null} placeholder="Traduza para o português..." className="book-input" />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={feedback !== null || !typedAnswer.trim()} className="btn-gold" style={{ width: '100%', marginTop: '2rem' }}>Invocar <Send size={18} /></motion.button>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {mcOptions.map((opt, i) => {
                    let btnStyle = {};
                    if (feedback && opt === activeWord.translation) btnStyle = { backgroundColor: 'var(--success)', color: 'white', borderColor: 'var(--success)' };
                    else if (feedback) btnStyle = { opacity: 0.5 };
                    return (
                      <motion.button whileHover={!feedback ? { scale: 1.02 } : {}} whileTap={!feedback ? { scale: 0.95 } : {}} key={i} onClick={() => handleMultipleChoiceSelect(opt)} disabled={feedback !== null} className="btn-outline" style={{ padding: '1.5rem', fontSize: '1.2rem', fontFamily: "'Cormorant Garamond', serif", ...btnStyle }}>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {phase === 2 && activeWord && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><Headphones size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Escute a Sabedoria</span>
              
              <div style={{ margin: '3rem 0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { playClick(); playAudio(activeWord.word, 1); }} className="btn-gold" style={{ padding: '1.5rem', borderRadius: '50%', width: '90px', height: '90px' }}>
                  <Headphones size={32} />
                </motion.button>
              </div>

              <form onSubmit={handleTypingSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
                <input type="text" autoFocus value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} disabled={feedback !== null} placeholder="Transcreva em inglês..." className="book-input" />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={feedback !== null || !typedAnswer.trim()} className="btn-gold" style={{ width: '100%', marginTop: '2rem' }}>Invocar <Send size={18} /></motion.button>
              </form>
            </div>
          )}

          {phase === 3 && activeWord && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              
              {difficulty === "APRENDIZ" && (
                <>
                  <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><Sparkles size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Embaralhamento Arcano</span>
                  <h2 style={{ fontSize: '2rem', color: 'var(--leather)', margin: '2rem 0' }}>{activeWord.translation}</h2>
                  <div style={{ fontSize: '3rem', color: 'var(--gold)', letterSpacing: '10px', marginBottom: '2rem', fontFamily: 'monospace' }}>{anagramWord}</div>
                  <form onSubmit={handleTypingSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <input type="text" autoFocus value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} disabled={feedback !== null} placeholder="Desembaralhe..." className="book-input" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={feedback !== null || !typedAnswer.trim()} className="btn-gold" style={{ width: '100%', marginTop: '2rem' }}>Conjurar <Send size={18} /></motion.button>
                  </form>
                </>
              )}

              {difficulty === "INICIANTE" && (
                <>
                  <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><BookOpen size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Forca Rúnica</span>
                  <h2 style={{ fontSize: '2rem', color: 'var(--leather)', margin: '2rem 0' }}>{activeWord.translation}</h2>
                  <div style={{ fontSize: '3.5rem', color: 'var(--gold-dark)', letterSpacing: '10px', marginBottom: '2rem', fontFamily: 'monospace' }}>
                    {activeWord.word.split("").map((c, i) => (i % 2 === 0 ? "_" : c)).join("")}
                  </div>
                  <form onSubmit={handleTypingSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <input type="text" autoFocus value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} disabled={feedback !== null} placeholder="Palavra completa..." className="book-input" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={feedback !== null || !typedAnswer.trim()} className="btn-gold" style={{ width: '100%', marginTop: '2rem' }}>Conjurar <Send size={18} /></motion.button>
                  </form>
                </>
              )}

              {difficulty === "INTERMEDIARIO" && (
                <>
                  <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><BookOpen size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> O Vazio das Palavras</span>
                  <p style={{ fontSize: '1.2rem', color: 'var(--ink-light)', fontStyle: 'italic', margin: '2rem 0 1rem 0' }}>{activeWord.sentencePt}</p>
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--leather)', margin: '0 0 2rem 0' }}>
                    {activeWord.sentenceEn.replace(new RegExp(`\\b${activeWord.word}\\b`, "i"), "_____")}
                  </h2>
                  <form onSubmit={handleTypingSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <input type="text" autoFocus value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} disabled={feedback !== null} placeholder={`Qual a palavra para: ${activeWord.translation}?`} className="book-input" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={feedback !== null || !typedAnswer.trim()} className="btn-gold" style={{ width: '100%', marginTop: '2rem' }}>Preencher a Lacuna <Send size={18} /></motion.button>
                  </form>
                </>
              )}

              {difficulty === "AVANCADO" && (
                <>
                  <span style={{ color: 'var(--error)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><Timer size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Provação de Velocidade</span>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.5)', marginTop: '1rem', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: '100%' }} animate={{ width: `${(advTimer / 5) * 100}%` }} transition={{ duration: 1, ease: "linear" }} style={{ height: '100%', background: 'var(--error)' }} />
                  </div>
                  <h2 style={{ fontSize: '3.5rem', color: 'var(--leather)', margin: '2rem 0' }}>{activeWord.translation}</h2>
                  <form onSubmit={handleTypingSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <input type="text" autoFocus value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} disabled={feedback !== null || advTimer === 0} placeholder="Traduza rápido!" className="book-input" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={feedback !== null || !typedAnswer.trim() || advTimer === 0} className="btn-gold" style={{ width: '100%', marginTop: '2rem', background: 'var(--error)', color: 'white' }}>Sobreviver <Send size={18} /></motion.button>
                  </form>
                </>
              )}

              {difficulty === "MESTRE" && (
                <>
                  <span style={{ color: 'var(--gold-dark)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><Swords size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Sintaxe Suprema</span>
                  <p style={{ fontSize: '1.2rem', color: 'var(--ink-light)', fontStyle: 'italic', margin: '2rem 0 1rem 0' }}>{activeWord.sentencePt}</p>
                  
                  <div style={{ minHeight: '60px', padding: '1rem', borderBottom: '2px solid var(--gold)', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                    {mestreSelected.map((block, i) => (
                      <div key={i} className="syntax-block selected">{block}</div>
                    ))}
                    {mestreSelected.length === 0 && <span style={{ color: 'var(--ink-muted)' }}>Construa a frase aqui...</span>}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '2rem' }}>
                    {mestreBlocks.map((block, i) => (
                      <div key={i} className="syntax-block" onClick={() => handleMestreSelect(block, i)}>{block}</div>
                    ))}
                  </div>

                  <motion.button onClick={handleMestreSubmit} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={feedback !== null || mestreBlocks.length > 0} className="btn-gold" style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>Conjurar Frase <Send size={18} /></motion.button>
                </>
              )}

            </div>
          )}

          {phase === 4 && activeWord && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em' }}><Mic size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Proclame a Palavra</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <h2 style={{ fontSize: '4.5rem', color: 'var(--leather)', margin: 0 }}>{activeWord.word}</h2>
                <button onClick={() => { playClick(); playAudio(activeWord.word); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold-dark)' }}><Headphones size={32} /></button>
              </div>
              <p style={{ color: 'var(--ink-light)', fontStyle: 'italic', marginBottom: '3rem', fontSize: '1.3rem', fontFamily: 'serif' }}>{activeWord.phonetic || "/.../"}</p>

              {voiceSupported && !showManualInput ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <motion.button whileHover={!isProcessingVoice && feedback === null ? { scale: 1.1 } : {}} whileTap={!isProcessingVoice && feedback === null ? { scale: 0.9 } : {}} onClick={startRecording} disabled={feedback !== null || isProcessingVoice} className={isRecording ? "btn-gold success-glow" : "btn-gold"} style={{ width: '110px', height: '110px', borderRadius: '50%', padding: 0 }}>
                    <Mic size={48} />
                  </motion.button>
                  {isRecording && <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }} style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Escutando... (clique para parar)</motion.p>}
                  {isProcessingVoice && <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }} style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>Decifrando voz...</motion.p>}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button onClick={() => { playClick(); setShowManualInput(true); }} className="btn-outline">Usar Pena e Tinta (Teclado)</button>
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                  {voiceError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--warning)', background: 'rgba(212,130,55,0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--warning)' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}><ShieldAlert size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> {voiceError}</p>
                    </motion.div>
                  )}
                  <form onSubmit={handleTypingSubmit}>
                    <input type="text" autoFocus value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} disabled={feedback !== null} placeholder="Digite a palavra..." className="book-input" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={feedback !== null || !typedAnswer.trim()} className="btn-gold" style={{ width: '100%', marginTop: '2rem' }}>Invocar <Send size={18} /></motion.button>
                  </form>
                </div>
              )}
            </div>
          )}

          {phase === 5 && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span style={{ color: 'var(--ink-muted)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', display: 'block', marginBottom: '2rem' }}><Sparkles size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> Una os Fragmentos (Memória)</span>
              
              <div className="memory-grid">
                {memoryCards.map((card, index) => {
                  const isFlipped = selectedCards.includes(index) || matchedCardIds.includes(card.wordId);
                  const isMatched = matchedCardIds.includes(card.wordId);
                  
                  return (
                    <motion.div whileHover={!isFlipped ? { scale: 1.05 } : {}} whileTap={!isFlipped ? { scale: 0.95 } : {}} key={index} className={`memory-card ${isFlipped ? "flipped" : ""} ${isMatched ? "matched" : ""}`} onClick={() => handleCardClick(index)}>
                      <div className="memory-card-inner">
                        <div className="memory-card-front"><Sparkles size={32} color="var(--gold)"/></div>
                        <div className="memory-card-back">{card.content}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {phase === 6 && (
            <div style={{ width: '100%', textAlign: 'left', padding: '1rem' }}>
              <span style={{ color: 'var(--gold-dark)', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', display: 'block', marginBottom: '2rem', textAlign: 'center' }}><BookOpen size={16} style={{ display: 'inline', marginBottom: '-2px' }}/> O Teste Final do Mestre</span>
              
              {readingLoading && <p style={{ textAlign: 'center', color: 'var(--ink)' }}>Conjurando o texto de desafio...</p>}
              
              {readingError && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--error)' }}>Falha ao conjurar o texto.</p>
                  <button onClick={finishGame} className="btn-gold" style={{ marginTop: '1rem' }}>Pular Teste</button>
                </div>
              )}

              {readingData && !readingLoading && !readingError && (
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <p style={{ whiteSpace: 'pre-wrap', color: 'var(--leather)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem', fontFamily: 'serif' }}>{readingData.text}</p>
                  <h3 style={{ color: 'var(--ink)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>{readingData.question}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {readingData.options.map((opt, i) => {
                      let btnStyle = {};
                      if (feedback && i === readingData.correctOptionIndex) btnStyle = { backgroundColor: 'var(--success)', color: 'white', borderColor: 'var(--success)' };
                      else if (feedback) btnStyle = { opacity: 0.5 };
                      return (
                        <motion.button 
                          whileHover={!feedback ? { scale: 1.01 } : {}} 
                          key={i} 
                          onClick={() => {
                            if (feedback) return;
                            playClick();
                            const isCorrect = i === readingData.correctOptionIndex;
                            if (isCorrect) {
                              playSuccess(); setFeedback("correct"); setCombo(c => c + 1);
                              setTimeout(() => finishGame(), 1500);
                            } else {
                              playError(); setFeedback("incorrect"); setCombo(0);
                              setTimeout(() => finishGame(), 2000);
                            }
                          }} 
                          disabled={feedback !== null} 
                          className="btn-outline" 
                          style={{ padding: '1rem', fontSize: '1rem', textAlign: 'left', ...btnStyle }}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={
      <main className="container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--gold)', marginTop: '40vh' }}>Carregando desafio...</div>
      </main>
    }>
      <ChallengeContent />
    </Suspense>
  );
}
