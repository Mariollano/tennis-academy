import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, X, Loader2, CheckCircle, AlertCircle, Calendar, ArrowRight, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

type AlternativeSlot = {
  date: string;
  time: string;
  spotsLeft: number;
  label: string;
};

type VoiceResult = {
  understood: boolean;
  message: string;
  redirectUrl: string | null;
  alternatives: AlternativeSlot[];
  programName: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  slotAvailable: boolean | null;
};

type RecordingState = "idle" | "recording" | "processing" | "result";

export default function VoiceBooking() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [quickBooked, setQuickBooked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const transcribeMutation = trpc.voiceBooking.transcribe.useMutation();
  const parseAndCheckMutation = trpc.voiceBooking.parseAndCheck.useMutation();
  const quickBookMutation = trpc.voiceBooking.quickBook.useMutation();

  // Listen for the custom event from the hero button
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-voice-booking', handler);
    return () => window.removeEventListener('open-voice-booking', handler);
  }, []);

  const animateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(Math.min(100, avg * 2));
    animFrameRef.current = requestAnimationFrame(animateAudioLevel);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analyser for visual feedback
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setState("recording");
      animFrameRef.current = requestAnimationFrame(animateAudioLevel);
    } catch (err) {
      toast.error("Microphone access denied. Please allow microphone access to use voice booking.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
    setState("processing");

    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());

    await new Promise<void>(resolve => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => resolve();
      } else {
        resolve();
      }
    });

    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

    try {
      // Upload audio to server for transcription
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-booking.webm");

      const uploadResponse = await fetch("/api/voice-upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadResponse.json();

      // Transcribe
      const transcribeResult = await transcribeMutation.mutateAsync({ audioUrl: url });
      setTranscript(transcribeResult.transcript);

      // Parse intent and check availability
      const parseResult = await parseAndCheckMutation.mutateAsync({
        transcript: transcribeResult.transcript,
      });

      setResult(parseResult as VoiceResult);
      setState("result");
    } catch (err) {
      toast.error("Failed to process voice request. Please try again.");
      setState("idle");
    }
  };

  const handleRedirect = (url: string) => {
    setIsOpen(false);
    setState("idle");
    setResult(null);
    setTranscript("");
    navigate(url);
  };

  const reset = () => {
    setState("idle");
    setResult(null);
    setTranscript("");
    setAudioLevel(0);
  };

  const close = () => {
    if (state === "recording") {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsOpen(false);
    reset();
  };

  const pulseScale = 1 + (audioLevel / 100) * 0.4;

  return (
    <>
      {/* Floating Microphone Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 z-40 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center group md:bottom-8"
        title="Voice Booking — tap and speak your booking request"
        aria-label="Voice Booking Assistant"
      >
        <Mic className="w-6 h-6" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Voice Book
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Mic className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="font-extrabold text-primary-foreground text-sm uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Voice Booking Assistant
                  </h2>
                  <p className="text-primary-foreground/60 text-xs">Powered by AI</p>
                </div>
              </div>
              <button onClick={close} className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {state === "idle" && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Mic className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-extrabold text-foreground text-xl mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    BOOK WITH YOUR VOICE
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                    Tap the button and say something like:<br />
                    <span className="italic text-foreground">"Book a private lesson for March 20 at 11 AM"</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-muted-foreground">
                    {[
                      "Book a private lesson tomorrow at 2 PM",
                      "105 clinic this Friday",
                      "Junior program next Monday",
                      "Summer camp next week",
                    ].map((example, i) => (
                      <div key={i} className="bg-muted rounded-lg p-2 text-left italic">
                        "{example}"
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={startRecording}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Mic className="w-5 h-5" /> Start Speaking
                  </button>
                </div>
              )}

              {state === "recording" && (
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-5">
                    {/* Pulse rings */}
                    <div
                      className="absolute inset-0 rounded-full bg-red-500/20 transition-transform duration-100"
                      style={{ transform: `scale(${pulseScale + 0.2})` }}
                    />
                    <div
                      className="absolute inset-0 rounded-full bg-red-500/30 transition-transform duration-100"
                      style={{ transform: `scale(${pulseScale + 0.1})` }}
                    />
                    <div
                      className="absolute inset-0 rounded-full bg-red-500 flex items-center justify-center transition-transform duration-100"
                      style={{ transform: `scale(${pulseScale})` }}
                    >
                      <Mic className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="font-extrabold text-foreground text-xl mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    LISTENING...
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Speak your booking request clearly
                  </p>
                  <button
                    onClick={stopRecording}
                    className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <MicOff className="w-5 h-5" /> Stop & Process
                  </button>
                </div>
              )}

              {state === "processing" && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <h3 className="font-extrabold text-foreground text-xl mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    PROCESSING...
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Transcribing and checking availability...
                  </p>
                  {transcript && (
                    <div className="mt-4 bg-muted rounded-xl p-3 text-sm text-foreground italic">
                      "{transcript}"
                    </div>
                  )}
                </div>
              )}

              {state === "result" && result && (
                <div>
                  {/* Transcript */}
                  {transcript && (
                    <div className="bg-muted rounded-xl p-3 mb-4 text-sm text-foreground italic flex items-start gap-2">
                      <Mic className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      "{transcript}"
                    </div>
                  )}

                  {/* Result */}
                  {result.understood && result.slotAvailable === true && result.redirectUrl ? (
                    // ✅ Available — redirect to booking or quick-book
                    <div className="text-center">
                      {quickBooked ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <h3 className="font-extrabold text-foreground text-lg mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            BOOKING CONFIRMED! 🎾
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4">Your session has been booked. Check your profile for details.</p>
                          <button
                            onClick={() => { setIsOpen(false); navigate("/profile"); }}
                            className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            View My Bookings <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <h3 className="font-extrabold text-foreground text-lg mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            GREAT NEWS! SLOT AVAILABLE
                          </h3>
                          <p className="text-muted-foreground text-sm mb-1">{result.message}</p>
                          {result.programName && (
                            <div className="flex items-center justify-center gap-2 mb-4 text-sm">
                              <span className="font-semibold text-primary">{result.programName}</span>
                              {result.requestedDate && (
                                <>
                                  <span className="text-muted-foreground">·</span>
                                  <span className="text-muted-foreground">
                                    {new Date(result.requestedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  </span>
                                </>
                              )}
                              {result.requestedTime && (
                                <>
                                  <span className="text-muted-foreground">·</span>
                                  <span className="text-muted-foreground">{result.requestedTime}</span>
                                </>
                              )}
                            </div>
                          )}
                          {/* One-tap Confirm & Book for logged-in users */}
                          {isAuthenticated && result.requestedDate && (
                            <button
                              onClick={async () => {
                                try {
                                  // Extract program type from redirectUrl (e.g. /book/private_lesson)
                                  const urlParts = result.redirectUrl?.split("/") || [];
                                  const programType = urlParts[urlParts.length - 1]?.split("?")[0] || "private_lesson";
                                  await quickBookMutation.mutateAsync({
                                    programType,
                                    sessionDate: result.requestedDate!,
                                    sessionTime: result.requestedTime || undefined,
                                  });
                                  setQuickBooked(true);
                                  toast.success("Booking confirmed! Check your profile.");
                                } catch (err: any) {
                                  toast.error(err.message || "Could not complete quick booking.");
                                }
                              }}
                              disabled={quickBookMutation.isPending}
                              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:brightness-105 transition-all flex items-center justify-center gap-2 mb-2 shadow-md"
                            >
                              {quickBookMutation.isPending ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</>
                              ) : (
                                <><Zap className="w-5 h-5" /> Confirm & Book Instantly</>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleRedirect(result.redirectUrl!)}
                            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-3"
                          >
                            <Calendar className="w-5 h-5" /> {isAuthenticated ? "Review & Book" : "Book This Session"} <ArrowRight className="w-4 h-4" />
                          </button>
                          <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Try a different request
                          </button>
                        </>
                      )}
                    </div>
                  ) : result.understood && result.slotAvailable === false && result.alternatives.length > 0 ? (
                    // ❌ Not available — show alternatives
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">That slot isn't available</h3>
                          <p className="text-muted-foreground text-xs mt-0.5">{result.message}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-3">Here are the next available times:</p>
                      <div className="space-y-2 mb-4">
                        {result.alternatives.map((alt, i) => (
                          <button
                            key={i}
                            onClick={() => handleRedirect(`${result.redirectUrl?.split("?")[0] || "/programs"}?date=${alt.date}&time=${alt.time}`)}
                            className="w-full flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted hover:border-primary transition-all text-left"
                          >
                            <div>
                              <div className="font-semibold text-foreground text-sm">{alt.label}</div>
                              <div className="text-xs text-green-600 font-medium">{alt.spotsLeft} spot{alt.spotsLeft !== 1 ? "s" : ""} left</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                      <button onClick={reset} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                        Try a different request
                      </button>
                    </div>
                  ) : result.understood && result.redirectUrl ? (
                    // ✅ Understood, no slot check needed — redirect
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-extrabold text-foreground text-lg mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        GOT IT!
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">{result.message}</p>
                      <button
                        onClick={() => handleRedirect(result.redirectUrl!)}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-3"
                      >
                        <Calendar className="w-5 h-5" /> Continue to Booking <ArrowRight className="w-4 h-4" />
                      </button>
                      <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Try a different request
                      </button>
                    </div>
                  ) : (
                    // ❌ Not understood
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="font-extrabold text-foreground text-lg mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        DIDN'T CATCH THAT
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">{result.message}</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Try saying: <span className="italic text-foreground">"Book a private lesson for March 20 at 11 AM"</span>
                      </p>
                      <button
                        onClick={reset}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Mic className="w-5 h-5" /> Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
