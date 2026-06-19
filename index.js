// // require("dotenv").config();

// // const express = require("express");
// // const http = require("http");
// // const { Server } = require("socket.io");
// // const WebSocket = require("ws");
// // const path = require("path");
// // const fs = require("fs");
// // const { v4: uuidv4 } = require("uuid");
// // const mongoose = require("mongoose");

// // // ─── Config ───────────────────────────────────────────────────────────────────
// // const PORT = process.env.BYD_VOICE_PORT || 4000;
// // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// // const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// // const ELEVENLABS_VOICE_ID = process.env.BYD_ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // "Sarah" – friendly, modern
// // const MONGODB_URI = process.env.MONGODB_URI;
// // const PREWARM_TTL_MS = 60_000;

// // // OpenAI Realtime defaults
// // const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// // const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
// // const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.75);
// // const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300);
// // const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 1500);

// // // ─── MongoDB Connection ───────────────────────────────────────────────────────
// // if (!MONGODB_URI) {
// //   console.warn("⚠️  MONGODB_URI not set — call logs will NOT be saved.");
// // } else {
// //   mongoose
// //     .connect(MONGODB_URI)
// //     .then(() => console.log("✅  MongoDB connected"))
// //     .catch((err) => console.error("❌  MongoDB error:", err.message));
// // }

// // // ─── Call Log Schema ──────────────────────────────────────────────────────────
// // const callLogSchema = new mongoose.Schema(
// //   {
// //     id: { type: String, required: true, unique: true },
// //     sessionId: { type: String, required: true },
// //     caller_name: { type: String, default: null },
// //     caller_phone: { type: String, default: null },
// //     caller_email: { type: String, default: null },
// //     vehicle_interest: { type: String, default: null },
// //     intent_category: {
// //       type: String,
// //       enum: [
// //         "vehicle_inquiry",
// //         "test_drive_booking",
// //         "pricing_inquiry",
// //         "trade_in_inquiry",
// //         "finance_inquiry",
// //         "service_booking",
// //         "general_enquiry",
// //         "staff_transfer",
// //         "comparison_request",
// //         "availability_check",
// //         "no_transcript_admin",
// //       ],
// //       required: true,
// //     },
// //     preferred_time: { type: String, default: null },
// //     staff_requested: { type: String, default: null },
// //     outcome: {
// //       type: String,
// //       enum: [
// //         "test_drive_booked",
// //         "callback_scheduled",
// //         "transferred",
// //         "info_provided",
// //         "brochure_sent",
// //         "message_taken",
// //         "escalated",
// //         "quote_provided",
// //       ],
// //       required: true,
// //     },
// //     ai_summary: { type: String, default: null },
// //     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
// //     confidence_score: { type: Number, default: null },
// //     escalated: { type: Boolean, default: false },
// //   },
// //   { timestamps: true }
// // );

// // const CallLog = mongoose.model("BYDCallLog", callLogSchema);

// // // ─── Recordings directory ─────────────────────────────────────────────────────
// // const RECORDINGS_DIR = path.join(__dirname, "recordings");
// // if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// // // ─── Express + Socket.IO ──────────────────────────────────────────────────────
// // const app = express();
// // const server = http.createServer(app);
// // const io = new Server(server, { cors: { origin: "*" } });

// // app.use(express.json());
// // app.use(express.static(path.join(__dirname, "public")));
// // app.use("/recordings", express.static(RECORDINGS_DIR));

// // // ─── Session State ────────────────────────────────────────────────────────────
// // const sessions = new Map();
// // const prewarmStates = new Map();

// // // ─── BYD Knowledge Base (inline for system prompt) ───────────────────────────
// // const BYD_KNOWLEDGE_SUMMARY = `
// // BYD VEHICLE LINEUP AT BYD FAIRFIELD:

// // ELECTRIC (BEV):
// // - ATTO 1: From $23,990 | Compact SUV | 220–310km range | Blade Battery | Great first EV
// // - ATTO 2: From $31,990 | Compact SUV | 345km range | 130kW | V2L capability
// // - ATTO 3: From $39,990 | Compact SUV | 420km range | 150kW | Most popular compact EV
// // - SEAL: From $52,990 | Sports sedan | 570km range (RWD) | Up to 390kW AWD | 3.8s 0-100
// // - SEALION 7: Mid-size SUV | 456km range | 230kW or 390kW AWD | Premium tech
// // - DOLPHIN: Compact hatchback | 427km range | City favourite | V2L | From ~$29,990

// // PLUG-IN HYBRID (PHEV):
// // - SEALION 5: PHEV SUV | DM-i tech | Long combined range | Affordable entry PHEV
// // - SEALION 6: From ~$44,990 | Mid-size PHEV SUV | DM-i | FWD | Ultra-low fuel use
// // - SEALION 8: 7-seat Super Hybrid SUV | DM-i/DM-p | Up to 359kW AWD | DiSus-C suspension
// // - SHARK 6: From $57,900 | PHEV dual-cab ute | 321–350kW | 800km combined range | 3,500kg towing

// // KEY TECH:
// // - Blade Battery: BYD's safe LFP battery — passes nail penetration test, cobalt-free
// // - V2L: Power external devices from the car battery
// // - DM-i: Efficient hybrid system, electric-first driving
// // - DM-p: Performance hybrid with AWD
// // - DiSus-C: Adaptive damping suspension
// // - OTA: Over-the-air updates
// // - WARRANTY: 6 years vehicle / 8 years or 160,000km battery

// // DEALERSHIP:
// // - BYD Fairfield | 415 Heidelberg Road, Fairfield VIC 3078
// // - Phone: 03 4110 8888 | bydfairfield.com.au
// // - Test drives available 7 days
// // `.trim();

// // // ─── System Prompt ────────────────────────────────────────────────────────────
// // function getSystemPrompt() {
// //   return `
// // =============================================================
// // ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING.
// // =============================================================
// // You MUST respond in English only. If the caller speaks another language,
// // say: "Sorry, I can only assist in English at the moment."
// // =============================================================

// // ### IDENTITY ###
// // You are the AI voice assistant for BYD Fairfield — an authorised BYD dealership at 415 Heidelberg Road, Fairfield VIC 3078.
// // You handle inbound enquiries: vehicle information, test drive bookings, pricing, comparisons, finance questions, and general dealership enquiries.
// // You sound like a friendly, knowledgeable Australian car sales consultant — warm, helpful, and enthusiastic about BYD.

// // ### AI DISCLOSURE ###
// // - Do NOT volunteer that you are AI.
// // - ONLY if explicitly asked "are you a robot / AI / real person?" — be honest:
// //   "Good question — I'm actually an AI assistant helping the BYD Fairfield team. I can book test drives, answer questions about any BYD model, and help you find the right car. How can I help?"
// // - Pivot straight back to helping them.

// // ### PERSONALITY ###
// // - Friendly, warm Australian manner
// // - Genuinely enthusiastic about BYD's technology (Blade Battery, V2L, range etc.)
// // - Never pushy — consultative and helpful
// // - Natural fillers: "absolutely", "great question", "no worries", "sure thing", "for sure"
// // - Match caller energy: relaxed with relaxed callers, efficient with busy ones

// // ### HOW YOU TALK ###
// // - SHORT responses — 1 to 2 sentences max
// // - Contractions: "what's", "we've", "I'll", "you're", "that's"
// // - ACKNOWLEDGE first, then respond
// // - ONE question at a time — never stack questions
// // - Silence/can't hear: "Still there?" or "Sorry, didn't catch that — could you say that again?"

// // ### BYD VEHICLE KNOWLEDGE ###
// // ${BYD_KNOWLEDGE_SUMMARY}

// // QUICK RECOMMENDATIONS:
// // - City / first EV → Atto 1, Atto 2, Dolphin
// // - Family compact EV → Atto 3
// // - Larger electric SUV → Sealion 7
// // - Performance EV → Seal Performance
// // - No range anxiety / long trips → Sealion 5, 6, 8 (PHEV) or Shark 6
// // - 7-seat family hybrid → Sealion 8
// // - Work ute / towing → Shark 6 Performance

// // =============================================================
// // CALL FLOW
// // =============================================================

// // STEP 01 — GREETING & INTENT
// // Greet first. Ask for name early. One question at a time.

// // Start: "Thanks for calling BYD Fairfield — you're through to the front desk. How can I help you today?"

// // Then: "Great — and who am I speaking with?"

// // Use their name naturally once you have it.

// // STEP 02 — VALUE PROP (for serious buyers only)
// // Trigger for: test drive requests, purchase intent, serious comparisons.
// // Skip for: quick info requests, direction questions.

// // Script (adapt naturally):
// // "We've got the full BYD range in stock at Fairfield — from the Dolphin city car right through to the Shark 6 ute. Every car comes with a 6-year warranty and BYD's industry-leading Blade Battery. We can arrange a test drive any day of the week — what's caught your eye?"

// // STEP 03 — PROACTIVE CLOSE
// // Never end passively. Always offer a next step.

// // For TEST DRIVE:
// // "I can lock that in for you — we've got slots tomorrow at 11am and Saturday at 10am. Which works better?"

// // For PRICING:
// // "The [model] starts from [price] drive-away. Would you like me to get one of our consultants to put together a personalised quote?"

// // For COMPARISON:
// // "[Model A] is the choice if you want [benefit A], while [Model B] suits [benefit B] better. Would you like to compare them in person with a test drive of both?"

// // STEP 04 — COLLECT DETAILS (when booking)
// // One detail at a time, conversationally:
// // - Name (may already have)
// // - Which vehicle they want to test / enquire about
// // - Preferred date/time
// // - Contact: phone or email

// // =============================================================
// // ESCALATION
// // =============================================================
// // ALWAYS escalate (log escalated: true) for:
// // - Complaints or disputes
// // - Finance / legal questions beyond general info
// // - Abusive callers
// // - Complex trade-in negotiations

// // Script: "I want to make sure you get the best help with this — let me connect you with one of our consultants right now. Just one moment."

// // =============================================================
// // STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
// // =============================================================
// // After every call where intent was established, call save_call_log.

// // Required: caller_name, intent_category, outcome
// // Optional but important: caller_phone, caller_email, vehicle_interest, preferred_time, ai_summary, sentiment, confidence_score, escalated

// // =============================================================
// // HARD RULES
// // =============================================================
// // - ENGLISH ONLY
// // - ONE question at a time
// // - 1–2 sentences max per response
// // - NEVER assume caller's name
// // - ALWAYS call save_call_log after every completed call
// // - Never give legal or finance advice beyond general info
// // - Never make up pricing not in your knowledge base
// // `.trim();
// // }

// // // ─── Tool Definition ──────────────────────────────────────────────────────────
// // function getSaveCallLogTool() {
// //   return {
// //     type: "function",
// //     name: "save_call_log",
// //     description:
// //       "Saves a structured call log after every completed BYD Fairfield call. MUST be called once intent is established and the call reaches a natural conclusion.",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         caller_name: { type: "string", description: "Full name of the caller" },
// //         caller_phone: { type: "string", description: "Caller's phone number" },
// //         caller_email: { type: "string", description: "Caller's email" },
// //         vehicle_interest: { type: "string", description: "Vehicle model they enquired about e.g. 'BYD Seal Performance', 'Shark 6'" },
// //         intent_category: {
// //           type: "string",
// //           enum: [
// //             "vehicle_inquiry", "test_drive_booking", "pricing_inquiry",
// //             "trade_in_inquiry", "finance_inquiry", "service_booking",
// //             "general_enquiry", "staff_transfer", "comparison_request",
// //             "availability_check", "no_transcript_admin",
// //           ],
// //         },
// //         preferred_time: { type: "string", description: "Booked or preferred time slot" },
// //         staff_requested: { type: "string", description: "Staff member requested by name" },
// //         outcome: {
// //           type: "string",
// //           enum: [
// //             "test_drive_booked", "callback_scheduled", "transferred",
// //             "info_provided", "brochure_sent", "message_taken",
// //             "escalated", "quote_provided",
// //           ],
// //         },
// //         ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
// //         sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
// //         confidence_score: { type: "number", description: "0.0 to 1.0" },
// //         escalated: { type: "boolean" },
// //       },
// //       required: ["caller_name", "intent_category", "outcome"],
// //     },
// //   };
// // }

// // // ─── Recording (WAV builder) ──────────────────────────────────────────────────
// // class ConversationRecorder {
// //   constructor(sessionId) {
// //     this.sessionId = sessionId;
// //     this.userChunks = [];
// //     this.agentChunks = [];
// //     this.startTime = Date.now();
// //   }

// //   addUserAudio(base64Pcm16) {
// //     this.userChunks.push(Buffer.from(base64Pcm16, "base64"));
// //   }

// //   addAgentAudio(base64Pcm16) {
// //     this.agentChunks.push(Buffer.from(base64Pcm16, "base64"));
// //   }

// //   _resample(pcmBuffer, srcRate, dstRate) {
// //     if (srcRate === dstRate) return pcmBuffer;
// //     const srcSamples = pcmBuffer.length / 2;
// //     const ratio = srcRate / dstRate;
// //     const dstSamples = Math.floor(srcSamples / ratio);
// //     const out = Buffer.alloc(dstSamples * 2);
// //     for (let i = 0; i < dstSamples; i++) {
// //       const srcIdx = i * ratio;
// //       const lo = Math.floor(srcIdx);
// //       const hi = Math.min(lo + 1, srcSamples - 1);
// //       const frac = srcIdx - lo;
// //       const sLo = pcmBuffer.readInt16LE(lo * 2);
// //       const sHi = pcmBuffer.readInt16LE(hi * 2);
// //       const val = Math.round(sLo + (sHi - sLo) * frac);
// //       out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
// //     }
// //     return out;
// //   }

// //   saveToFile() {
// //     const OUTPUT_RATE = 24000;
// //     const userPcm = Buffer.concat(this.userChunks);
// //     const agentPcm = this._resample(Buffer.concat(this.agentChunks), 16000, OUTPUT_RATE);
// //     const totalSamples = Math.max(userPcm.length / 2, agentPcm.length / 2);
// //     const mixed = Buffer.alloc(totalSamples * 2);

// //     for (let i = 0; i < totalSamples; i++) {
// //       let v = 0;
// //       if (i < userPcm.length / 2) v += userPcm.readInt16LE(i * 2);
// //       if (i < agentPcm.length / 2) v += agentPcm.readInt16LE(i * 2);
// //       mixed.writeInt16LE(Math.max(-32768, Math.min(32767, v)), i * 2);
// //     }

// //     const hdr = Buffer.alloc(44);
// //     const dataSize = mixed.length;
// //     hdr.write("RIFF", 0);
// //     hdr.writeUInt32LE(36 + dataSize, 4);
// //     hdr.write("WAVE", 8);
// //     hdr.write("fmt ", 12);
// //     hdr.writeUInt32LE(16, 16);
// //     hdr.writeUInt16LE(1, 20);
// //     hdr.writeUInt16LE(1, 22);
// //     hdr.writeUInt32LE(OUTPUT_RATE, 24);
// //     hdr.writeUInt32LE(OUTPUT_RATE * 2, 28);
// //     hdr.writeUInt16LE(2, 32);
// //     hdr.writeUInt16LE(16, 34);
// //     hdr.write("data", 36);
// //     hdr.writeUInt32LE(dataSize, 40);

// //     const wav = Buffer.concat([hdr, mixed]);
// //     const filename = `byd_call_${this.sessionId}_${Date.now()}.wav`;
// //     const filepath = path.join(RECORDINGS_DIR, filename);
// //     fs.writeFileSync(filepath, wav);
// //     console.log(`[Recording] Saved: ${filename} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
// //     return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
// //   }
// // }

// // // ─── Helpers ──────────────────────────────────────────────────────────────────
// // function sendWsJson(ws, payload) {
// //   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
// //   ws.send(JSON.stringify(payload));
// //   return true;
// // }

// // function toFunctionCallPayload(value) {
// //   if (!value || typeof value !== "object") return null;
// //   if (typeof value.name === "string" && typeof value.arguments === "string" && typeof value.call_id === "string") {
// //     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
// //   }
// //   return null;
// // }

// // function extractFunctionCallsFromResponse(response) {
// //   const calls = [];
// //   const output = response?.output;
// //   if (Array.isArray(output)) {
// //     for (const item of output) {
// //       const fc = toFunctionCallPayload(item);
// //       if (fc) calls.push(fc);
// //     }
// //   }
// //   return calls;
// // }

// // // ─── OpenAI Realtime Session ──────────────────────────────────────────────────
// // function createRealtimeSession(sessionId, onEvent) {
// //   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;

// //   return new Promise((resolve, reject) => {
// //     const ws = new WebSocket(url, {
// //       headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
// //     });

// //     ws.on("open", () => {
// //       console.log(`[${sessionId}] OpenAI Realtime connected`);

// //       const sessionUpdate = {
// //         type: "session.update",
// //         session: {
// //           type: "realtime",
// //           model: OPENAI_REALTIME_MODEL,
// //           output_modalities: ["text"],
// //           audio: {
// //             input: {
// //               format: {
// //                 type: "audio/pcm",
// //                 rate: OPENAI_INPUT_SAMPLE_RATE,
// //               },
// //               turn_detection: {
// //                 type: "server_vad",
// //                 threshold: OPENAI_VAD_THRESHOLD,
// //                 prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
// //                 silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
// //               },
// //             },
// //           },
// //           instructions: getSystemPrompt(),
// //           tools: [getSaveCallLogTool()],
// //           tool_choice: "auto",
// //         },
// //       };

// //       sendWsJson(ws, sessionUpdate);

// //       const session = {
// //         ws,
// //         elevenLabsWs: null,
// //         elevenLabsReady: false,
// //         textBuffer: [],
// //         isResponseActive: false,
// //         onEvent,
// //         processedCallIds: new Set(),
// //         recorder: new ConversationRecorder(sessionId),
// //         callLogs: [],
// //       };

// //       sessions.set(sessionId, session);
// //       openElevenLabsStream(sessionId);
// //       resolve();
// //     });

// //     ws.on("message", async (data) => {
// //       try {
// //         const event = JSON.parse(data.toString());
// //         await handleRealtimeEvent(sessionId, event);
// //       } catch (err) {
// //         console.error(`[${sessionId}] Parse error:`, err.message);
// //       }
// //     });

// //     ws.on("error", (err) => {
// //       console.error(`[${sessionId}] OpenAI WS error:`, err.message);
// //       onEvent({ type: "error", error: { message: err.message } });
// //       reject(err);
// //     });

// //     ws.on("close", (code) => {
// //       console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
// //       closeElevenLabsWs(sessionId);
// //       sessions.delete(sessionId);
// //       onEvent({ type: "session-closed" });
// //     });
// //   });
// // }

// // // ─── Audio helpers ────────────────────────────────────────────────────────────
// // function sendAudio(sessionId, base64Audio) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;
// //   session.recorder.addUserAudio(base64Audio);
// //   sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
// // }

// // function triggerGreeting(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;
// //   console.log(`[${sessionId}] Triggering greeting`);
// //   sendWsJson(session.ws, { type: "response.create" });
// // }

// // // ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
// // function openElevenLabsStream(sessionId, force = false) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   if (!force && session.elevenLabsWs &&
// //     (session.elevenLabsWs.readyState === WebSocket.OPEN || session.elevenLabsWs.readyState === WebSocket.CONNECTING)) {
// //     return;
// //   }

// //   closeElevenLabsWs(sessionId);

// //   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
// //   const elWs = new WebSocket(wsUrl);

// //   elWs.on("open", () => {
// //     console.log(`[${sessionId}] ElevenLabs connected`);
// //     elWs.send(JSON.stringify({
// //       text: " ",
// //       voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
// //       xi_api_key: ELEVENLABS_API_KEY,
// //     }));

// //     if (session.elevenLabsWs === elWs) {
// //       session.elevenLabsReady = true;
// //       for (const text of session.textBuffer) sendTextToElevenLabs(sessionId, text);
// //       session.textBuffer = [];
// //     }
// //   });

// //   elWs.on("message", (data) => {
// //     try {
// //       const msg = JSON.parse(data.toString());
// //       if (msg.audio) {
// //         session.recorder.addAgentAudio(msg.audio);
// //         session.onEvent({ type: "audio-delta", delta: msg.audio });
// //       }
// //     } catch {}
// //   });

// //   elWs.on("error", (err) => console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`));
// //   elWs.on("close", () => { if (session.elevenLabsWs === elWs) session.elevenLabsReady = false; });

// //   session.elevenLabsWs = elWs;
// // }

// // function sendTextToElevenLabs(sessionId, text) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// //     session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
// //   } else if (session) {
// //     session.textBuffer.push(text);
// //   }
// // }

// // function flushElevenLabsStream(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
// //     session.elevenLabsWs.send(JSON.stringify({ text: "" }));
// //   }
// // }

// // function closeElevenLabsWs(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session?.elevenLabsWs) {
// //     try {
// //       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) session.elevenLabsWs.terminate();
// //       else if (session.elevenLabsWs.readyState === WebSocket.OPEN) session.elevenLabsWs.close();
// //     } catch {}
// //     session.elevenLabsWs = null;
// //     session.elevenLabsReady = false;
// //     session.textBuffer = [];
// //   }
// // }

// // // ─── Function call handler ────────────────────────────────────────────────────
// // async function handleFunctionCall(sessionId, eventOrItem) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   const call = toFunctionCallPayload(eventOrItem);
// //   if (!call || call.name !== "save_call_log") return;

// //   const callId = call.call_id;
// //   if (callId && session.processedCallIds.has(callId)) return;
// //   if (callId) session.processedCallIds.add(callId);

// //   try {
// //     const args = JSON.parse(call.arguments);
// //     console.log(`[${sessionId}] Saving call log | intent: ${args.intent_category} | outcome: ${args.outcome}`);

// //     const logId = uuidv4();
// //     const callLog = new CallLog({
// //       id: logId,
// //       sessionId,
// //       caller_name: args.caller_name || null,
// //       caller_phone: args.caller_phone || null,
// //       caller_email: args.caller_email || null,
// //       vehicle_interest: args.vehicle_interest || null,
// //       intent_category: args.intent_category,
// //       preferred_time: args.preferred_time || null,
// //       staff_requested: args.staff_requested || null,
// //       outcome: args.outcome,
// //       ai_summary: args.ai_summary || null,
// //       sentiment: args.sentiment || "neutral",
// //       confidence_score: args.confidence_score || null,
// //       escalated: args.escalated || false,
// //     });

// //     await callLog.save();
// //     session.callLogs.push({ id: logId, ...args });
// //     console.log(`[${sessionId}] Call log saved: ${logId}`);

// //     sendWsJson(session.ws, {
// //       type: "conversation.item.create",
// //       item: {
// //         type: "function_call_output",
// //         call_id: call.call_id,
// //         output: JSON.stringify({ success: true, log_id: logId, outcome: args.outcome }),
// //       },
// //     });
// //     sendWsJson(session.ws, { type: "response.create" });
// //     session.onEvent({ type: "call-logged", data: args });
// //   } catch (err) {
// //     if (callId) session.processedCallIds.delete(callId);
// //     console.error(`[${sessionId}] Call log save failed:`, err.message);
// //   }
// // }

// // // ─── OpenAI Event handler ─────────────────────────────────────────────────────
// // async function handleRealtimeEvent(sessionId, event) {
// //   const session = sessions.get(sessionId);
// //   if (!session) return;

// //   switch (event.type) {
// //     case "session.created":
// //     case "session.updated":
// //       break;

// //     case "response.created":
// //       session.isResponseActive = true;
// //       openElevenLabsStream(sessionId);
// //       break;

// //     case "response.output_text.delta":
// //     case "response.text.delta":
// //       if (session.elevenLabsReady) sendTextToElevenLabs(sessionId, event.delta);
// //       else session.textBuffer.push(event.delta);
// //       session.onEvent({ type: "transcript-delta", delta: event.delta });
// //       break;

// //     case "response.output_text.done":
// //     case "response.text.done":
// //       flushElevenLabsStream(sessionId);
// //       session.onEvent({ type: "transcript-done", transcript: event.text });
// //       break;

// //     case "response.done": {
// //       session.isResponseActive = false;
// //       const calls = extractFunctionCallsFromResponse(event.response);
// //       for (const fc of calls) await handleFunctionCall(sessionId, fc);
// //       break;
// //     }

// //     case "response.output_item.done":
// //       if (event.item) {
// //         const fc = toFunctionCallPayload(event.item);
// //         if (fc) await handleFunctionCall(sessionId, fc);
// //       }
// //       break;

// //     case "response.function_call_arguments.done":
// //       await handleFunctionCall(sessionId, event);
// //       break;

// //     case "input_audio_buffer.speech_started":
// //       console.log(`[${sessionId}] Caller interrupted`);
// //       if (session.isResponseActive) sendWsJson(session.ws, { type: "response.cancel" });
// //       closeElevenLabsWs(sessionId);
// //       openElevenLabsStream(sessionId, true);
// //       session.onEvent({ type: "speech-started" });
// //       break;

// //     case "conversation.item.input_audio_transcription.completed":
// //       session.onEvent({ type: "user-transcript", transcript: event.transcript });
// //       break;

// //     case "error":
// //       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
// //       session.onEvent({ type: "error", error: event.error });
// //       break;

// //     default:
// //       break;
// //   }
// // }

// // // ─── Close session ────────────────────────────────────────────────────────────
// // function closeSession(sessionId) {
// //   const session = sessions.get(sessionId);
// //   if (session) {
// //     try {
// //       const result = session.recorder.saveToFile();
// //       session.onEvent({ type: "recording-saved", data: { filename: result.filename, url: `/recordings/${result.filename}` } });
// //     } catch (err) {
// //       console.error(`[${sessionId}] Recording save failed:`, err.message);
// //     }
// //     closeElevenLabsWs(sessionId);
// //     try { session.ws.close(); } catch {}
// //     sessions.delete(sessionId);
// //     console.log(`[${sessionId}] Session closed`);
// //   }
// // }

// // // ─── Prewarm ──────────────────────────────────────────────────────────────────
// // function clearPrewarmState(sessionId) {
// //   const state = prewarmStates.get(sessionId);
// //   if (!state) return;
// //   clearTimeout(state.ttlTimer);
// //   prewarmStates.delete(sessionId);
// // }

// // function startPrewarm(sessionId, eventForwarder) {
// //   if (prewarmStates.has(sessionId)) return prewarmStates.get(sessionId).promise;

// //   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

// //   state.promise = createRealtimeSession(sessionId, eventForwarder)
// //     .then(() => { state.ready = true; console.log(`[${sessionId}] Prewarm ready`); })
// //     .catch((err) => { state.failed = true; throw err; });

// //   state.ttlTimer = setTimeout(() => {
// //     if (!prewarmStates.has(sessionId)) return;
// //     console.log(`[${sessionId}] Prewarm TTL expired`);
// //     clearPrewarmState(sessionId);
// //     closeSession(sessionId);
// //   }, PREWARM_TTL_MS);

// //   prewarmStates.set(sessionId, state);
// //   return state.promise;
// // }

// // // ─── Event Forwarder ──────────────────────────────────────────────────────────
// // function buildEventForwarder(socket) {
// //   return (event) => {
// //     switch (event.type) {
// //       case "audio-delta": socket.emit("audio-delta", { delta: event.delta }); break;
// //       case "transcript-delta": socket.emit("transcript-delta", { delta: event.delta }); break;
// //       case "transcript-done": socket.emit("transcript-done", { transcript: event.transcript }); break;
// //       case "user-transcript": socket.emit("user-transcript", { transcript: event.transcript }); break;
// //       case "speech-started": socket.emit("speech-started", {}); break;
// //       case "call-logged": socket.emit("call-logged", event.data); break;
// //       case "recording-saved": socket.emit("recording-saved", event.data); break;
// //       case "error": socket.emit("realtime-error", { error: event.error }); break;
// //       case "session-closed": socket.emit("session-closed", {}); break;
// //     }
// //   };
// // }

// // // ─── Socket.IO ────────────────────────────────────────────────────────────────
// // io.on("connection", (socket) => {
// //   console.log(`Client connected: ${socket.id}`);
// //   const forwarder = buildEventForwarder(socket);
// //   startPrewarm(socket.id, forwarder).catch(() => {});

// //   socket.on("start-session", async () => {
// //     const sessionId = socket.id;
// //     console.log(`[${sessionId}] Starting voice session`);
// //     try {
// //       let state = prewarmStates.get(sessionId);
// //       if (!state) {
// //         await startPrewarm(sessionId, forwarder);
// //         state = prewarmStates.get(sessionId);
// //       }
// //       if (state) {
// //         try {
// //           await state.promise;
// //           if (state.ready) {
// //             clearPrewarmState(sessionId);
// //             socket.emit("session-started", { sessionId });
// //             triggerGreeting(sessionId);
// //             return;
// //           }
// //         } catch {}
// //         clearPrewarmState(sessionId);
// //       }
// //       await createRealtimeSession(sessionId, forwarder);
// //       socket.emit("session-started", { sessionId });
// //       triggerGreeting(sessionId);
// //     } catch (err) {
// //       console.error(`[${sessionId}] Session start failed:`, err.message);
// //       socket.emit("realtime-error", { error: { message: "Failed to connect to AI service" } });
// //     }
// //   });

// //   socket.on("audio-chunk", (data) => { if (data?.audio) sendAudio(socket.id, data.audio); });

// //   socket.on("end-session", () => {
// //     console.log(`[${socket.id}] End session requested`);
// //     clearPrewarmState(socket.id);
// //     closeSession(socket.id);
// //     socket.emit("session-closed", {});
// //   });

// //   socket.on("disconnect", () => {
// //     console.log(`Client disconnected: ${socket.id}`);
// //     clearPrewarmState(socket.id);
// //     closeSession(socket.id);
// //   });
// // });

// // // ─── REST Endpoints ───────────────────────────────────────────────────────────
// // app.get("/api/call-logs", async (req, res) => {
// //   try {
// //     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
// //     res.json(logs);
// //   } catch (err) {
// //     res.status(500).json({ error: "Failed to fetch call logs" });
// //   }
// // });

// // app.get("/api/call-logs/intent/:intent", async (req, res) => {
// //   try {
// //     const logs = await CallLog.find({ intent_category: req.params.intent }).sort({ createdAt: -1 }).lean();
// //     res.json(logs);
// //   } catch (err) {
// //     res.status(500).json({ error: "Failed to fetch call logs" });
// //   }
// // });

// // app.get("/api/recordings", (req, res) => {
// //   const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
// //   res.json(files.map((f) => ({
// //     filename: f,
// //     url: `/recordings/${f}`,
// //     size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
// //   })));
// // });

// // app.get("/api/health", (req, res) => res.json({ status: "ok", sessions: sessions.size }));

// // // ─── Start ────────────────────────────────────────────────────────────────────
// // server.listen(PORT, () => {
// //   console.log(`
// // ╔══════════════════════════════════════════════════════════════╗
// // ║   BYD Fairfield — AI Voice Agent (OmniSuiteAI)               ║
// // ║   Running on http://localhost:${PORT}                         ║
// // ║                                                              ║
// // ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// // ║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
// // ║   MongoDB:        ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
// // ╚══════════════════════════════════════════════════════════════╝
// //   `);
// // });
// require("dotenv").config();

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const WebSocket = require("ws");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
// const mongoose = require("mongoose");

// // ─── Config ───────────────────────────────────────────────────────────────────
// const PORT = process.env.BYD_VOICE_PORT || 4000;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // "Sarah" – friendly, modern
// const MONGODB_URI = process.env.MONGODB_URI;
// const PREWARM_TTL_MS = 60_000;

// // OpenAI Realtime defaults — aligned with Ray White GA settings
// const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// const OPENAI_INPUT_SAMPLE_RATE = Number(process.env.OPENAI_INPUT_SAMPLE_RATE || 24000);
// const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
// const OPENAI_VAD_PREFIX_PADDING_MS = Number(process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300);
// const OPENAI_VAD_SILENCE_DURATION_MS = Number(process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000);

// // ─── MongoDB Connection ───────────────────────────────────────────────────────
// if (!MONGODB_URI) {
//   console.warn("⚠️  MONGODB_URI not set — call logs will NOT be saved.");
// } else {
//   mongoose
//     .connect(MONGODB_URI)
//     .then(() => console.log("✅  MongoDB connected"))
//     .catch((err) => console.error("❌  MongoDB error:", err.message));
// }

// // ─── Call Log Schema ──────────────────────────────────────────────────────────
// const callLogSchema = new mongoose.Schema(
//   {
//     id: { type: String, required: true, unique: true },
//     sessionId: { type: String, required: true },
//     caller_name: { type: String, default: null },
//     caller_phone: { type: String, default: null },
//     caller_email: { type: String, default: null },
//     vehicle_interest: { type: String, default: null },
//     intent_category: {
//       type: String,
//       enum: [
//         "vehicle_inquiry",
//         "test_drive_booking",
//         "pricing_inquiry",
//         "trade_in_inquiry",
//         "finance_inquiry",
//         "service_booking",
//         "general_enquiry",
//         "staff_transfer",
//         "comparison_request",
//         "availability_check",
//         "no_transcript_admin",
//       ],
//       required: true,
//     },
//     preferred_time: { type: String, default: null },
//     staff_requested: { type: String, default: null },
//     outcome: {
//       type: String,
//       enum: [
//         "test_drive_booked",
//         "callback_scheduled",
//         "transferred",
//         "info_provided",
//         "brochure_sent",
//         "message_taken",
//         "escalated",
//         "quote_provided",
//       ],
//       required: true,
//     },
//     ai_summary: { type: String, default: null },
//     sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
//     confidence_score: { type: Number, default: null },
//     escalated: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// const CallLog = mongoose.model("BYDCallLog", callLogSchema);

// // ─── Recordings directory ─────────────────────────────────────────────────────
// const RECORDINGS_DIR = path.join(__dirname, "recordings");
// if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// // ─── Express + Socket.IO ──────────────────────────────────────────────────────
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// app.use(express.json());
// app.use(express.static(path.join(__dirname, "public")));
// app.use("/recordings", express.static(RECORDINGS_DIR));

// // ─── Session State ────────────────────────────────────────────────────────────
// const sessions = new Map();
// const prewarmStates = new Map();

// // ─── BYD Knowledge Base (inline for system prompt) ───────────────────────────
// const BYD_KNOWLEDGE_SUMMARY = `
// BYD VEHICLE LINEUP AT BYD FAIRFIELD:

// ELECTRIC (BEV):
// - ATTO 1: From $23,990 | Compact SUV | 220–310km range | Blade Battery | Great first EV
// - ATTO 2: From $31,990 | Compact SUV | 345km range | 130kW | V2L capability
// - ATTO 3: From $39,990 | Compact SUV | 420km range | 150kW | Most popular compact EV
// - SEAL: From $52,990 | Sports sedan | 570km range (RWD) | Up to 390kW AWD | 3.8s 0-100
// - SEALION 7: Mid-size SUV | 456km range | 230kW or 390kW AWD | Premium tech
// - DOLPHIN: Compact hatchback | 427km range | City favourite | V2L | From ~$29,990

// PLUG-IN HYBRID (PHEV):
// - SEALION 5: PHEV SUV | DM-i tech | Long combined range | Affordable entry PHEV
// - SEALION 6: From ~$44,990 | Mid-size PHEV SUV | DM-i | FWD | Ultra-low fuel use
// - SEALION 8: 7-seat Super Hybrid SUV | DM-i/DM-p | Up to 359kW AWD | DiSus-C suspension
// - SHARK 6: From $57,900 | PHEV dual-cab ute | 321–350kW | 800km combined range | 3,500kg towing

// KEY TECH:
// - Blade Battery: BYD's safe LFP battery — passes nail penetration test, cobalt-free
// - V2L: Power external devices from the car battery
// - DM-i: Efficient hybrid system, electric-first driving
// - DM-p: Performance hybrid with AWD
// - DiSus-C: Adaptive damping suspension
// - OTA: Over-the-air updates
// - WARRANTY: 6 years vehicle / 8 years or 160,000km battery

// DEALERSHIP:
// - BYD Fairfield | 415 Heidelberg Road, Fairfield VIC 3078
// - Phone: 03 4110 8888 | bydfairfield.com.au
// - Test drives available 7 days
// `.trim();

// // ─── System Prompt ────────────────────────────────────────────────────────────
// function getSystemPrompt() {
//   return `
// =============================================================
// ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING.
// =============================================================
// You MUST respond in English only. If the caller speaks another language,
// say: "Sorry, I can only assist in English at the moment."
// =============================================================

// ### IDENTITY ###
// You are the AI voice assistant for BYD Fairfield — an authorised BYD dealership at 415 Heidelberg Road, Fairfield VIC 3078.
// You handle inbound enquiries: vehicle information, test drive bookings, pricing, comparisons, finance questions, and general dealership enquiries.
// You sound like a friendly, knowledgeable Australian car sales consultant — warm, helpful, and enthusiastic about BYD.

// ### AI DISCLOSURE ###
// - Do NOT volunteer that you are AI.
// - ONLY if explicitly asked "are you a robot / AI / real person?" — be honest:
//   "Good question — I'm actually an AI assistant helping the BYD Fairfield team. I can book test drives, answer questions about any BYD model, and help you find the right car. How can I help?"
// - Pivot straight back to helping them.

// ### PERSONALITY ###
// - Friendly, warm Australian manner
// - Genuinely enthusiastic about BYD's technology (Blade Battery, V2L, range etc.)
// - Never pushy — consultative and helpful
// - Natural fillers: "absolutely", "great question", "no worries", "sure thing", "for sure"
// - Match caller energy: relaxed with relaxed callers, efficient with busy ones

// ### HOW YOU TALK ###
// - SHORT responses — 1 to 2 sentences max
// - Contractions: "what's", "we've", "I'll", "you're", "that's"
// - ACKNOWLEDGE first, then respond
// - ONE question at a time — never stack questions
// - Silence/can't hear: "Still there?" or "Sorry, didn't catch that — could you say that again?"

// ### BYD VEHICLE KNOWLEDGE ###
// ${BYD_KNOWLEDGE_SUMMARY}

// QUICK RECOMMENDATIONS:
// - City / first EV → Atto 1, Atto 2, Dolphin
// - Family compact EV → Atto 3
// - Larger electric SUV → Sealion 7
// - Performance EV → Seal Performance
// - No range anxiety / long trips → Sealion 5, 6, 8 (PHEV) or Shark 6
// - 7-seat family hybrid → Sealion 8
// - Work ute / towing → Shark 6 Performance

// =============================================================
// CALL FLOW
// =============================================================

// STEP 01 — GREETING & INTENT
// Greet first. Ask for name early. One question at a time.

// Start: "Thanks for calling BYD Fairfield — you're through to the front desk. How can I help you today?"

// Then: "Great — and who am I speaking with?"

// Use their name naturally once you have it.

// STEP 02 — VALUE PROP (for serious buyers only)
// Trigger for: test drive requests, purchase intent, serious comparisons.
// Skip for: quick info requests, direction questions.

// Script (adapt naturally):
// "We've got the full BYD range in stock at Fairfield — from the Dolphin city car right through to the Shark 6 ute. Every car comes with a 6-year warranty and BYD's industry-leading Blade Battery. We can arrange a test drive any day of the week — what's caught your eye?"

// STEP 03 — PROACTIVE CLOSE
// Never end passively. Always offer a next step.

// For TEST DRIVE:
// "I can lock that in for you — we've got slots tomorrow at 11am and Saturday at 10am. Which works better?"

// For PRICING:
// "The [model] starts from [price] drive-away. Would you like me to get one of our consultants to put together a personalised quote?"

// For COMPARISON:
// "[Model A] is the choice if you want [benefit A], while [Model B] suits [benefit B] better. Would you like to compare them in person with a test drive of both?"

// STEP 04 — COLLECT DETAILS (when booking)
// One detail at a time, conversationally:
// - Name (may already have)
// - Which vehicle they want to test / enquire about
// - Preferred date/time
// - Contact: phone or email

// =============================================================
// ESCALATION
// =============================================================
// ALWAYS escalate (log escalated: true) for:
// - Complaints or disputes
// - Finance / legal questions beyond general info
// - Abusive callers
// - Complex trade-in negotiations

// Script: "I want to make sure you get the best help with this — let me connect you with one of our consultants right now. Just one moment."

// =============================================================
// STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
// =============================================================
// After every call where intent was established, call save_call_log.

// Required: caller_name, intent_category, outcome
// Optional but important: caller_phone, caller_email, vehicle_interest, preferred_time, ai_summary, sentiment, confidence_score, escalated

// =============================================================
// HARD RULES
// =============================================================
// - ENGLISH ONLY
// - ONE question at a time
// - 1–2 sentences max per response
// - NEVER assume caller's name
// - ALWAYS call save_call_log after every completed call
// - Never give legal or finance advice beyond general info
// - Never make up pricing not in your knowledge base
// `.trim();
// }

// // ─── Tool Definition ──────────────────────────────────────────────────────────
// function getSaveCallLogTool() {
//   return {
//     type: "function",
//     name: "save_call_log",
//     description:
//       "Saves a structured call log after every completed BYD Fairfield call. MUST be called once intent is established and the call reaches a natural conclusion.",
//     parameters: {
//       type: "object",
//       properties: {
//         caller_name: { type: "string", description: "Full name of the caller" },
//         caller_phone: { type: "string", description: "Caller's phone number" },
//         caller_email: { type: "string", description: "Caller's email" },
//         vehicle_interest: { type: "string", description: "Vehicle model they enquired about e.g. 'BYD Seal Performance', 'Shark 6'" },
//         intent_category: {
//           type: "string",
//           enum: [
//             "vehicle_inquiry", "test_drive_booking", "pricing_inquiry",
//             "trade_in_inquiry", "finance_inquiry", "service_booking",
//             "general_enquiry", "staff_transfer", "comparison_request",
//             "availability_check", "no_transcript_admin",
//           ],
//         },
//         preferred_time: { type: "string", description: "Booked or preferred time slot" },
//         staff_requested: { type: "string", description: "Staff member requested by name" },
//         outcome: {
//           type: "string",
//           enum: [
//             "test_drive_booked", "callback_scheduled", "transferred",
//             "info_provided", "brochure_sent", "message_taken",
//             "escalated", "quote_provided",
//           ],
//         },
//         ai_summary: { type: "string", description: "1–2 sentence summary of the call" },
//         sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
//         confidence_score: { type: "number", description: "0.0 to 1.0" },
//         escalated: { type: "boolean" },
//       },
//       required: ["caller_name", "intent_category", "outcome"],
//     },
//   };
// }

// // ─── Recording (WAV builder) ──────────────────────────────────────────────────
// class ConversationRecorder {
//   constructor(sessionId) {
//     this.sessionId = sessionId;
//     this.userChunks = [];
//     this.agentChunks = [];
//     this.startTime = Date.now();
//     this.events = [];
//   }

//   addUserAudio(base64Pcm16) {
//     const buf = Buffer.from(base64Pcm16, "base64");
//     this.userChunks.push(buf);
//     this.events.push({ type: "user", time: Date.now() - this.startTime, bytes: buf.length });
//   }

//   addAgentAudio(base64Pcm16) {
//     const buf = Buffer.from(base64Pcm16, "base64");
//     this.agentChunks.push(buf);
//     this.events.push({ type: "agent", time: Date.now() - this.startTime, bytes: buf.length });
//   }

//   _resample(pcmBuffer, srcRate, dstRate) {
//     if (srcRate === dstRate) return pcmBuffer;
//     const srcSamples = pcmBuffer.length / 2;
//     const ratio = srcRate / dstRate;
//     const dstSamples = Math.floor(srcSamples / ratio);
//     const out = Buffer.alloc(dstSamples * 2);
//     for (let i = 0; i < dstSamples; i++) {
//       const srcIdx = i * ratio;
//       const lo = Math.floor(srcIdx);
//       const hi = Math.min(lo + 1, srcSamples - 1);
//       const frac = srcIdx - lo;
//       const sLo = pcmBuffer.readInt16LE(lo * 2);
//       const sHi = pcmBuffer.readInt16LE(hi * 2);
//       const val = Math.round(sLo + (sHi - sLo) * frac);
//       out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
//     }
//     return out;
//   }

//   saveToFile() {
//     const OUTPUT_RATE = 24000;
//     const userPcm = Buffer.concat(this.userChunks);
//     const agentPcm = this._resample(Buffer.concat(this.agentChunks), 16000, OUTPUT_RATE);
//     const totalSamples = Math.max(userPcm.length / 2, agentPcm.length / 2);
//     const mixed = Buffer.alloc(totalSamples * 2);

//     for (let i = 0; i < totalSamples; i++) {
//       let v = 0;
//       if (i < userPcm.length / 2) v += userPcm.readInt16LE(i * 2);
//       if (i < agentPcm.length / 2) v += agentPcm.readInt16LE(i * 2);
//       mixed.writeInt16LE(Math.max(-32768, Math.min(32767, v)), i * 2);
//     }

//     const hdr = Buffer.alloc(44);
//     const dataSize = mixed.length;
//     hdr.write("RIFF", 0);
//     hdr.writeUInt32LE(36 + dataSize, 4);
//     hdr.write("WAVE", 8);
//     hdr.write("fmt ", 12);
//     hdr.writeUInt32LE(16, 16);
//     hdr.writeUInt16LE(1, 20);
//     hdr.writeUInt16LE(1, 22);
//     hdr.writeUInt32LE(OUTPUT_RATE, 24);
//     hdr.writeUInt32LE(OUTPUT_RATE * 2, 28);
//     hdr.writeUInt16LE(2, 32);
//     hdr.writeUInt16LE(16, 34);
//     hdr.write("data", 36);
//     hdr.writeUInt32LE(dataSize, 40);

//     const wav = Buffer.concat([hdr, mixed]);
//     const filename = `byd_call_${this.sessionId}_${Date.now()}.wav`;
//     const filepath = path.join(RECORDINGS_DIR, filename);
//     fs.writeFileSync(filepath, wav);
//     console.log(`[Recording] Saved: ${filename} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`);
//     return { filename, filepath, sizeMB: (wav.length / 1024 / 1024).toFixed(2) };
//   }
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function sendWsJson(ws, payload) {
//   if (!ws || ws.readyState !== WebSocket.OPEN) return false;
//   ws.send(JSON.stringify(payload));
//   return true;
// }

// function safeJsonParse(text) {
//   try {
//     return JSON.parse(text);
//   } catch {
//     return null;
//   }
// }

// function toFunctionCallPayload(value) {
//   if (!value || typeof value !== "object") return null;

//   // Explicit function_call type check (GA API format)
//   if (
//     value.type === "function_call" &&
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
//   }

//   // Fallback: legacy / event-level format
//   if (
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return { name: value.name, arguments: value.arguments, call_id: value.call_id };
//   }

//   return null;
// }

// function extractFunctionCallsFromResponse(response) {
//   const calls = [];
//   const output = response?.output;
//   if (Array.isArray(output)) {
//     for (const item of output) {
//       const fc = toFunctionCallPayload(item);
//       if (fc) calls.push(fc);
//     }
//   }
//   return calls;
// }

// // ─── OpenAI Realtime Session ──────────────────────────────────────────────────
// function createRealtimeSession(sessionId, onEvent) {
//   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
//   const startMs = Date.now();

//   return new Promise((resolve, reject) => {
//     const ws = new WebSocket(url, {
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//     });

//     ws.on("open", () => {
//       console.log(`[${sessionId}] OpenAI Realtime connected (${Date.now() - startMs}ms)`);

//       // Use GA-style session.update format (same as Ray White)
//       sendWsJson(ws, {
//         type: "session.update",
//         session: {
//           type: "realtime",
//           model: OPENAI_REALTIME_MODEL,
//           output_modalities: ["text"],
//           audio: {
//             input: {
//               format: {
//                 type: "audio/pcm",
//                 rate: OPENAI_INPUT_SAMPLE_RATE,
//               },
//               turn_detection: {
//                 type: "server_vad",
//                 threshold: OPENAI_VAD_THRESHOLD,
//                 prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
//                 silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
//               },
//             },
//           },
//           instructions: getSystemPrompt(),
//           tools: [getSaveCallLogTool()],
//           tool_choice: "auto",
//         },
//       });

//       const session = {
//         ws,
//         elevenLabsWs: null,
//         elevenLabsReady: false,
//         textBuffer: [],
//         isResponseActive: false,
//         onEvent,
//         startMs,
//         openAiConnectedMs: Date.now(),
//         elevenLabsConnectedMs: null,
//         greetingTriggeredMs: null,
//         firstResponseCreatedMs: null,
//         firstAudioDeltaLogged: false,
//         processedCallIds: new Set(),
//         recorder: new ConversationRecorder(sessionId),
//         callLogs: [],
//       };

//       sessions.set(sessionId, session);
//       openElevenLabsStream(sessionId);
//       resolve();
//     });

//     ws.on("message", async (data) => {
//       try {
//         const event = JSON.parse(data.toString());
//         await handleRealtimeEvent(sessionId, event);
//       } catch (err) {
//         console.error(`[${sessionId}] Parse error:`, err.message);
//       }
//     });

//     ws.on("error", (err) => {
//       console.error(`[${sessionId}] OpenAI WS error:`, err.message);
//       onEvent({ type: "error", error: { message: err.message } });
//       reject(err);
//     });

//     ws.on("close", (code) => {
//       console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
//       closeElevenLabsWs(sessionId);
//       sessions.delete(sessionId);
//       onEvent({ type: "session-closed" });
//     });
//   });
// }

// // ─── Audio helpers ────────────────────────────────────────────────────────────
// function sendAudio(sessionId, base64Audio) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   session.recorder.addUserAudio(base64Audio);
//   sendWsJson(session.ws, { type: "input_audio_buffer.append", audio: base64Audio });
// }

// function triggerGreeting(sessionId) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   session.greetingTriggeredMs = Date.now();
//   console.log(`[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`);
//   sendWsJson(session.ws, { type: "response.create" });
// }

// // ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
// function openElevenLabsStream(sessionId, force = false) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (!force && session.elevenLabsWs &&
//     (session.elevenLabsWs.readyState === WebSocket.OPEN || session.elevenLabsWs.readyState === WebSocket.CONNECTING)) {
//     return;
//   }

//   closeElevenLabsWs(sessionId);

//   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
//   const elWs = new WebSocket(wsUrl);

//   elWs.on("open", () => {
//     console.log(`[${sessionId}] ElevenLabs connected`);
//     session.elevenLabsConnectedMs = Date.now();

//     elWs.send(JSON.stringify({
//       text: " ",
//       voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
//       xi_api_key: ELEVENLABS_API_KEY,
//     }));

//     if (session.elevenLabsWs === elWs) {
//       session.elevenLabsReady = true;
//       for (const text of session.textBuffer) sendTextToElevenLabs(sessionId, text);
//       session.textBuffer = [];
//     }
//   });

//   elWs.on("message", (data) => {
//     try {
//       const msg = JSON.parse(data.toString());
//       if (msg.audio) {
//         session.recorder.addAgentAudio(msg.audio);
//         session.onEvent({ type: "audio-delta", delta: msg.audio });
//       }
//     } catch {}
//   });

//   elWs.on("error", (err) => console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`));
//   elWs.on("close", () => { if (session.elevenLabsWs === elWs) session.elevenLabsReady = false; });

//   session.elevenLabsWs = elWs;
// }

// function sendTextToElevenLabs(sessionId, text) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
//     session.elevenLabsWs.send(JSON.stringify({ text, try_trigger_generation: true }));
//   } else if (session) {
//     session.textBuffer.push(text);
//   }
// }

// function flushElevenLabsStream(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
//     session.elevenLabsWs.send(JSON.stringify({ text: "" }));
//   }
// }

// function closeElevenLabsWs(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session?.elevenLabsWs) {
//     try {
//       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING) session.elevenLabsWs.terminate();
//       else if (session.elevenLabsWs.readyState === WebSocket.OPEN) session.elevenLabsWs.close();
//     } catch {}
//     session.elevenLabsWs = null;
//     session.elevenLabsReady = false;
//     session.textBuffer = [];
//   }
// }

// // ─── Function call handler ────────────────────────────────────────────────────
// async function handleFunctionCall(sessionId, eventOrItem) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   const call = toFunctionCallPayload(eventOrItem);
//   if (!call || call.name !== "save_call_log") return;

//   const callId = typeof call.call_id === "string" ? call.call_id : null;
//   if (callId && session.processedCallIds.has(callId)) return;
//   if (callId) session.processedCallIds.add(callId);

//   try {
//     const args = JSON.parse(call.arguments);
//     console.log(`[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`);

//     const logId = uuidv4();
//     const callLog = new CallLog({
//       id: logId,
//       sessionId,
//       caller_name: args.caller_name || null,
//       caller_phone: args.caller_phone || null,
//       caller_email: args.caller_email || null,
//       vehicle_interest: args.vehicle_interest || null,
//       intent_category: args.intent_category,
//       preferred_time: args.preferred_time || null,
//       staff_requested: args.staff_requested || null,
//       outcome: args.outcome,
//       ai_summary: args.ai_summary || null,
//       sentiment: args.sentiment || "neutral",
//       confidence_score: args.confidence_score || null,
//       escalated: args.escalated || false,
//     });

//     await callLog.save();
//     session.callLogs.push({ id: logId, ...args });
//     console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

//     sendWsJson(session.ws, {
//       type: "conversation.item.create",
//       item: {
//         type: "function_call_output",
//         call_id: call.call_id,
//         output: JSON.stringify({
//           success: true,
//           message: "Call log saved successfully.",
//           log_id: logId,
//           outcome: args.outcome,
//         }),
//       },
//     });
//     sendWsJson(session.ws, { type: "response.create" });
//     session.onEvent({ type: "call-logged", data: args });
//   } catch (err) {
//     if (callId) session.processedCallIds.delete(callId);
//     console.error(`[${sessionId}] Call log save failed:`, err.message);
//   }
// }

// // ─── OpenAI Event handler ─────────────────────────────────────────────────────
// async function handleRealtimeEvent(sessionId, event) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   switch (event.type) {
//     case "session.created":
//     case "session.updated":
//       break;

//     case "response.created":
//       session.isResponseActive = true;
//       if (!session.firstResponseCreatedMs) {
//         session.firstResponseCreatedMs = Date.now();
//       }
//       openElevenLabsStream(sessionId);
//       break;

//     case "response.output_text.delta":
//     case "response.text.delta":
//       if (session.elevenLabsReady) sendTextToElevenLabs(sessionId, event.delta);
//       else session.textBuffer.push(event.delta);
//       session.onEvent({ type: "transcript-delta", delta: event.delta });
//       break;

//     case "response.output_text.done":
//     case "response.text.done":
//       flushElevenLabsStream(sessionId);
//       session.onEvent({ type: "transcript-done", transcript: event.text });
//       break;

//     case "response.done": {
//       session.isResponseActive = false;
//       const calls = extractFunctionCallsFromResponse(event.response);
//       for (const fc of calls) await handleFunctionCall(sessionId, fc);
//       break;
//     }

//     case "response.output_item.done":
//       if (event.item) {
//         const fc = toFunctionCallPayload(event.item);
//         if (fc) await handleFunctionCall(sessionId, fc);
//       }
//       break;

//     case "response.function_call_arguments.done":
//       await handleFunctionCall(sessionId, event);
//       break;

//     case "input_audio_buffer.speech_started":
//       console.log(`[${sessionId}] User interrupted — stopping AI voice`);
//       if (session.isResponseActive) sendWsJson(session.ws, { type: "response.cancel" });
//       closeElevenLabsWs(sessionId);
//       openElevenLabsStream(sessionId, true);
//       session.onEvent({ type: "speech-started" });
//       break;

//     case "conversation.item.input_audio_transcription.completed":
//       session.onEvent({ type: "user-transcript", transcript: event.transcript });
//       break;

//     case "error":
//       console.error(`[${sessionId}] OpenAI error:`, JSON.stringify(event.error));
//       session.onEvent({ type: "error", error: event.error });
//       break;

//     default:
//       break;
//   }
// }

// // ─── Close session ────────────────────────────────────────────────────────────
// function closeSession(sessionId) {
//   const session = sessions.get(sessionId);
//   if (session) {
//     try {
//       const result = session.recorder.saveToFile();
//       session.onEvent({ type: "recording-saved", data: { filename: result.filename, url: `/recordings/${result.filename}` } });
//     } catch (err) {
//       console.error(`[${sessionId}] Recording save failed:`, err.message);
//     }
//     closeElevenLabsWs(sessionId);
//     try { session.ws.close(); } catch {}
//     sessions.delete(sessionId);
//     console.log(`[${sessionId}] Session closed`);
//   }
// }

// // ─── Prewarm ──────────────────────────────────────────────────────────────────
// function clearPrewarmState(sessionId) {
//   const state = prewarmStates.get(sessionId);
//   if (!state) return;
//   clearTimeout(state.ttlTimer);
//   prewarmStates.delete(sessionId);
// }

// function startPrewarm(sessionId, eventForwarder) {
//   if (prewarmStates.has(sessionId)) return prewarmStates.get(sessionId).promise;

//   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

//   state.promise = createRealtimeSession(sessionId, eventForwarder)
//     .then(() => { state.ready = true; console.log(`[${sessionId}] Prewarm ready`); })
//     .catch((err) => { state.failed = true; console.warn(`[${sessionId}] Prewarm failed: ${err.message}`); throw err; });

//   state.ttlTimer = setTimeout(() => {
//     if (!prewarmStates.has(sessionId)) return;
//     console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
//     clearPrewarmState(sessionId);
//     closeSession(sessionId);
//   }, PREWARM_TTL_MS);

//   prewarmStates.set(sessionId, state);
//   return state.promise;
// }

// // ─── Event Forwarder ──────────────────────────────────────────────────────────
// function buildEventForwarder(socket) {
//   return (event) => {
//     switch (event.type) {
//       case "audio-delta": socket.emit("audio-delta", { delta: event.delta }); break;
//       case "transcript-delta": socket.emit("transcript-delta", { delta: event.delta }); break;
//       case "transcript-done": socket.emit("transcript-done", { transcript: event.transcript }); break;
//       case "user-transcript": socket.emit("user-transcript", { transcript: event.transcript }); break;
//       case "speech-started": socket.emit("speech-started", {}); break;
//       case "call-logged": socket.emit("call-logged", event.data); break;
//       case "recording-saved": socket.emit("recording-saved", event.data); break;
//       case "error": socket.emit("realtime-error", { error: event.error }); break;
//       case "session-closed": socket.emit("session-closed", {}); break;
//     }
//   };
// }

// // ─── Socket.IO ────────────────────────────────────────────────────────────────
// io.on("connection", (socket) => {
//   console.log(`Client connected: ${socket.id}`);
//   const forwarder = buildEventForwarder(socket);
//   startPrewarm(socket.id, forwarder).catch(() => {});

//   socket.on("start-session", async () => {
//     const sessionId = socket.id;
//     console.log(`[${sessionId}] Starting voice session`);
//     try {
//       let state = prewarmStates.get(sessionId);
//       if (!state) {
//         await startPrewarm(sessionId, forwarder);
//         state = prewarmStates.get(sessionId);
//       }
//       if (state) {
//         try {
//           await state.promise;
//           if (state.ready) {
//             clearPrewarmState(sessionId);
//             socket.emit("session-started", { sessionId });
//             triggerGreeting(sessionId);
//             return;
//           }
//         } catch {}
//         clearPrewarmState(sessionId);
//       }
//       await createRealtimeSession(sessionId, forwarder);
//       socket.emit("session-started", { sessionId });
//       triggerGreeting(sessionId);
//     } catch (err) {
//       console.error(`[${sessionId}] Session start failed:`, err.message);
//       socket.emit("realtime-error", { error: { message: "Failed to connect to AI service" } });
//     }
//   });

//   socket.on("audio-chunk", (data) => { if (data?.audio) sendAudio(socket.id, data.audio); });

//   socket.on("end-session", () => {
//     console.log(`[${socket.id}] End session requested`);
//     clearPrewarmState(socket.id);
//     closeSession(socket.id);
//     socket.emit("session-closed", {});
//   });

//   socket.on("disconnect", () => {
//     console.log(`Client disconnected: ${socket.id}`);
//     clearPrewarmState(socket.id);
//     closeSession(socket.id);
//   });
// });

// // ─── REST Endpoints ───────────────────────────────────────────────────────────
// app.get("/api/call-logs", async (req, res) => {
//   try {
//     const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
//     res.json(logs);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch call logs" });
//   }
// });

// app.get("/api/call-logs/intent/:intent", async (req, res) => {
//   try {
//     const logs = await CallLog.find({ intent_category: req.params.intent }).sort({ createdAt: -1 }).lean();
//     res.json(logs);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch call logs" });
//   }
// });

// app.get("/api/recordings", (req, res) => {
//   const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith(".wav"));
//   res.json(files.map((f) => ({
//     filename: f,
//     url: `/recordings/${f}`,
//     size: (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
//   })));
// });

// app.get("/api/health", (req, res) => res.json({ status: "ok", sessions: sessions.size }));

// // ─── Start ────────────────────────────────────────────────────────────────────
// server.listen(PORT, () => {
//   console.log(`
// ╔══════════════════════════════════════════════════════════════╗
// ║   BYD Fairfield — AI Voice Agent (OmniSuiteAI)               ║
// ║   Running on http://localhost:${PORT}                         ║
// ║                                                              ║
// ║   Model:          ${OPENAI_REALTIME_MODEL}                   ║
// ║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
// ║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
// ║   MongoDB:        ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
// ╚══════════════════════════════════════════════════════════════╝
//   `);
// });

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = process.env.BYD_VOICE_PORT || 4030;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
const MONGODB_URI = process.env.MONGODB_URI;
const PREWARM_TTL_MS = 60_000;

const OPENAI_REALTIME_MODEL =
  process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
const OPENAI_INPUT_SAMPLE_RATE = Number(
  process.env.OPENAI_INPUT_SAMPLE_RATE || 24000,
);
const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
const OPENAI_VAD_PREFIX_PADDING_MS = Number(
  process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300,
);
const OPENAI_VAD_SILENCE_DURATION_MS = Number(
  process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000,
);

// ─── MongoDB Connection ───────────────────────────────────────────────────────
if (!MONGODB_URI) {
  console.warn("⚠️  MONGODB_URI not set — call logs will NOT be saved.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅  MongoDB connected"))
    .catch((err) => console.error("❌  MongoDB error:", err.message));
}

// ─── Call Log Schema ──────────────────────────────────────────────────────────
const callLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    caller_name: { type: String, default: null },
    caller_phone: { type: String, default: null },
    caller_email: { type: String, default: null },
    vehicle_interest: { type: String, default: null },
    intent_category: {
      type: String,
      enum: [
        "vehicle_inquiry",
        "test_drive_booking",
        "pricing_inquiry",
        "trade_in_inquiry",
        "finance_inquiry",
        "service_booking",
        "general_enquiry",
        "staff_transfer",
        "comparison_request",
        "availability_check",
        "no_transcript_admin",
      ],
      required: true,
    },
    preferred_time: { type: String, default: null },
    staff_requested: { type: String, default: null },
    outcome: {
      type: String,
      enum: [
        "test_drive_booked",
        "callback_scheduled",
        "transferred",
        "info_provided",
        "brochure_sent",
        "message_taken",
        "escalated",
        "quote_provided",
      ],
      required: true,
    },
    ai_summary: { type: String, default: null },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    confidence_score: { type: Number, default: null },
    escalated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const CallLog = mongoose.model("BYDCallLog", callLogSchema);

// ─── Recordings directory ─────────────────────────────────────────────────────
const RECORDINGS_DIR = path.join(__dirname, "recordings");
if (!fs.existsSync(RECORDINGS_DIR))
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

// ─── Express + Socket.IO ──────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/recordings", express.static(RECORDINGS_DIR));

// ─── Session State ────────────────────────────────────────────────────────────
const sessions = new Map();
const prewarmStates = new Map();

// ─── BYD Knowledge Base ───────────────────────────────────────────────────────
const BYD_KNOWLEDGE_SUMMARY = `
BYD VEHICLE LINEUP AT BYD FAIRFIELD:

ELECTRIC (BEV):
- ATTO 1: From $23,990 | Compact SUV | 220–310km range | Blade Battery | Great first EV
- ATTO 2: From $31,990 | Compact SUV | 345km range | 130kW | V2L capability
- ATTO 3: From $39,990 | Compact SUV | 420km range | 150kW | Most popular compact EV
- SEAL: From $52,990 | Sports sedan | 570km range (RWD) | Up to 390kW AWD | 3.8s 0-100
- SEALION 7: Mid-size SUV | 456km range | 230kW or 390kW AWD | Premium tech
- DOLPHIN: Compact hatchback | 427km range | City favourite | V2L | From ~$29,990

PLUG-IN HYBRID (PHEV):
- SEALION 5: PHEV SUV | DM-i tech | Long combined range | Affordable entry PHEV
- SEALION 6: From ~$44,990 | Mid-size PHEV SUV | DM-i | FWD | Ultra-low fuel use
- SEALION 8: 7-seat Super Hybrid SUV | DM-i/DM-p | Up to 359kW AWD | DiSus-C suspension
- SHARK 6: From $57,900 | PHEV dual-cab ute | 321–350kW | 800km combined range | 3,500kg towing

KEY TECH:
- Blade Battery: BYD's safe LFP battery — passes nail penetration test, cobalt-free
- V2L: Power external devices from the car battery
- DM-i: Efficient hybrid system, electric-first driving
- DM-p: Performance hybrid with AWD
- DiSus-C: Adaptive damping suspension
- OTA: Over-the-air updates
- WARRANTY: 6 years vehicle / 8 years or 160,000km battery

DEALERSHIP:
- BYD Fairfield | 415 Heidelberg Road, Fairfield VIC 3078
- Phone: 03 4110 8888 | bydfairfield.com.au
- Test drives available 7 days
`.trim();

// ─── System Prompt ────────────────────────────────────────────────────────────
function getSystemPrompt() {
  return `
=============================================================
ABSOLUTE RULE — ENGLISH ONLY. THIS OVERRIDES EVERYTHING.
=============================================================
You MUST respond in English only. If the caller speaks another language,
say: "Sorry, I can only assist in English at the moment."
=============================================================

### IDENTITY ###
You are the AI voice assistant for BYD Fairfield — an authorised BYD dealership at 415 Heidelberg Road, Fairfield VIC 3078.
You handle inbound enquiries: vehicle information, test drive bookings, pricing, comparisons, finance questions, and general dealership enquiries.
You sound like a friendly, knowledgeable Australian car sales consultant — warm, helpful, and enthusiastic about BYD.

### AI DISCLOSURE ###
- Do NOT volunteer that you are AI.
- ONLY if explicitly asked "are you a robot / AI / real person?" — be honest:
  "Good question — I'm actually an AI assistant helping the BYD Fairfield team. I can book test drives, answer questions about any BYD model, and help you find the right car. How can I help?"
- Pivot straight back to helping them.

### PERSONALITY ###
- Friendly, warm Australian manner
- Genuinely enthusiastic about BYD's technology (Blade Battery, V2L, range etc.)
- Never pushy — consultative and helpful
- Natural fillers: "absolutely", "great question", "no worries", "sure thing", "for sure"
- Match caller energy: relaxed with relaxed callers, efficient with busy ones

### HOW YOU TALK ###
- SHORT responses — 1 to 2 sentences max
- Contractions: "what's", "we've", "I'll", "you're", "that's"
- ACKNOWLEDGE first, then respond
- ONE question at a time — never stack questions
- Silence/can't hear: "Still there?" or "Sorry, didn't catch that — could you say that again?"

### BYD VEHICLE KNOWLEDGE ###
${BYD_KNOWLEDGE_SUMMARY}

QUICK RECOMMENDATIONS:
- City / first EV → Atto 1, Atto 2, Dolphin
- Family compact EV → Atto 3
- Larger electric SUV → Sealion 7
- Performance EV → Seal Performance
- No range anxiety / long trips → Sealion 5, 6, 8 (PHEV) or Shark 6
- 7-seat family hybrid → Sealion 8
- Work ute / towing → Shark 6 Performance

=============================================================
CALL FLOW
=============================================================

STEP 01 — GREETING & INTENT
Greet first. Ask for name early. One question at a time.

Start: "Thanks for calling BYD Fairfield — you're through to the front desk. How can I help you today?"

Then: "Great — and who am I speaking with?"

Use their name naturally once you have it.

STEP 02 — VALUE PROP (for serious buyers only)
Trigger for: test drive requests, purchase intent, serious comparisons.
Skip for: quick info requests, direction questions.

Script (adapt naturally):
"We've got the full BYD range in stock at Fairfield — from the Dolphin city car right through to the Shark 6 ute. Every car comes with a 6-year warranty and BYD's industry-leading Blade Battery. We can arrange a test drive any day of the week — what's caught your eye?"

STEP 03 — PROACTIVE CLOSE
Never end passively. Always offer a next step.

For TEST DRIVE:
"I can lock that in for you — we've got slots tomorrow at 11am and Saturday at 10am. Which works better?"

For PRICING:
"The [model] starts from [price] drive-away. Would you like me to get one of our consultants to put together a personalised quote?"

For COMPARISON:
"[Model A] is the choice if you want [benefit A], while [Model B] suits [benefit B] better. Would you like to compare them in person with a test drive of both?"

STEP 04 — COLLECT DETAILS (when booking)
One detail at a time, conversationally:
- Name (may already have)
- Which vehicle they want to test / enquire about
- Preferred date/time
- Contact: phone or email

=============================================================
ESCALATION
=============================================================
ALWAYS escalate (log escalated: true) for:
- Complaints or disputes
- Finance / legal questions beyond general info
- Abusive callers
- Complex trade-in negotiations

Script: "I want to make sure you get the best help with this — let me connect you with one of our consultants right now. Just one moment."

=============================================================
STEP 05 — SAVE CALL LOG (MANDATORY after every completed call)
=============================================================
After every call where intent was established, call save_call_log.

Required: caller_name, intent_category, outcome
Optional but important: caller_phone, caller_email, vehicle_interest, preferred_time, ai_summary, sentiment, confidence_score, escalated

=============================================================
HARD RULES
=============================================================
- ENGLISH ONLY
- ONE question at a time
- 1–2 sentences max per response
- NEVER assume caller's name
- ALWAYS call save_call_log after every completed call
- Never give legal or finance advice beyond general info
- Never make up pricing not in your knowledge base
`.trim();
}

// ─── Tool Definition ──────────────────────────────────────────────────────────
function getSaveCallLogTool() {
  return {
    type: "function",
    name: "save_call_log",
    description:
      "Saves a structured call log after every completed BYD Fairfield call. MUST be called once intent is established and the call reaches a natural conclusion.",
    parameters: {
      type: "object",
      properties: {
        caller_name: { type: "string", description: "Full name of the caller" },
        caller_phone: { type: "string", description: "Caller's phone number" },
        caller_email: { type: "string", description: "Caller's email" },
        vehicle_interest: {
          type: "string",
          description:
            "Vehicle model they enquired about e.g. 'BYD Seal Performance', 'Shark 6'",
        },
        intent_category: {
          type: "string",
          enum: [
            "vehicle_inquiry",
            "test_drive_booking",
            "pricing_inquiry",
            "trade_in_inquiry",
            "finance_inquiry",
            "service_booking",
            "general_enquiry",
            "staff_transfer",
            "comparison_request",
            "availability_check",
            "no_transcript_admin",
          ],
        },
        preferred_time: {
          type: "string",
          description: "Booked or preferred time slot",
        },
        staff_requested: {
          type: "string",
          description: "Staff member requested by name",
        },
        outcome: {
          type: "string",
          enum: [
            "test_drive_booked",
            "callback_scheduled",
            "transferred",
            "info_provided",
            "brochure_sent",
            "message_taken",
            "escalated",
            "quote_provided",
          ],
        },
        ai_summary: {
          type: "string",
          description: "1–2 sentence summary of the call",
        },
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative"],
        },
        confidence_score: { type: "number", description: "0.0 to 1.0" },
        escalated: { type: "boolean" },
      },
      required: ["caller_name", "intent_category", "outcome"],
    },
  };
}

// ─── Recording (WAV builder) ──────────────────────────────────────────────────
class ConversationRecorder {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.userChunks = [];
    this.agentChunks = [];
    this.startTime = Date.now();
    this.events = [];
  }

  addUserAudio(base64Pcm16) {
    const buf = Buffer.from(base64Pcm16, "base64");
    this.userChunks.push(buf);
    this.events.push({
      type: "user",
      time: Date.now() - this.startTime,
      bytes: buf.length,
    });
  }

  addAgentAudio(base64Pcm16) {
    const buf = Buffer.from(base64Pcm16, "base64");
    this.agentChunks.push(buf);
    this.events.push({
      type: "agent",
      time: Date.now() - this.startTime,
      bytes: buf.length,
    });
  }

  _resample(pcmBuffer, srcRate, dstRate) {
    if (srcRate === dstRate) return pcmBuffer;
    const srcSamples = pcmBuffer.length / 2;
    const ratio = srcRate / dstRate;
    const dstSamples = Math.floor(srcSamples / ratio);
    const out = Buffer.alloc(dstSamples * 2);
    for (let i = 0; i < dstSamples; i++) {
      const srcIdx = i * ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, srcSamples - 1);
      const frac = srcIdx - lo;
      const sLo = pcmBuffer.readInt16LE(lo * 2);
      const sHi = pcmBuffer.readInt16LE(hi * 2);
      const val = Math.round(sLo + (sHi - sLo) * frac);
      out.writeInt16LE(Math.max(-32768, Math.min(32767, val)), i * 2);
    }
    return out;
  }

  saveToFile() {
    const OUTPUT_RATE = 24000;
    const userPcm = Buffer.concat(this.userChunks);
    const agentPcm = this._resample(
      Buffer.concat(this.agentChunks),
      16000,
      OUTPUT_RATE,
    );
    const totalSamples = Math.max(userPcm.length / 2, agentPcm.length / 2);
    const mixed = Buffer.alloc(totalSamples * 2);

    for (let i = 0; i < totalSamples; i++) {
      let v = 0;
      if (i < userPcm.length / 2) v += userPcm.readInt16LE(i * 2);
      if (i < agentPcm.length / 2) v += agentPcm.readInt16LE(i * 2);
      mixed.writeInt16LE(Math.max(-32768, Math.min(32767, v)), i * 2);
    }

    const hdr = Buffer.alloc(44);
    const dataSize = mixed.length;
    hdr.write("RIFF", 0);
    hdr.writeUInt32LE(36 + dataSize, 4);
    hdr.write("WAVE", 8);
    hdr.write("fmt ", 12);
    hdr.writeUInt32LE(16, 16);
    hdr.writeUInt16LE(1, 20);
    hdr.writeUInt16LE(1, 22);
    hdr.writeUInt32LE(OUTPUT_RATE, 24);
    hdr.writeUInt32LE(OUTPUT_RATE * 2, 28);
    hdr.writeUInt16LE(2, 32);
    hdr.writeUInt16LE(16, 34);
    hdr.write("data", 36);
    hdr.writeUInt32LE(dataSize, 40);

    const wav = Buffer.concat([hdr, mixed]);
    const filename = `byd_call_${this.sessionId}_${Date.now()}.wav`;
    const filepath = path.join(RECORDINGS_DIR, filename);
    fs.writeFileSync(filepath, wav);
    console.log(
      `[Recording] Saved: ${filename} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`,
    );
    return {
      filename,
      filepath,
      sizeMB: (wav.length / 1024 / 1024).toFixed(2),
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sendWsJson(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(payload));
  return true;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toFunctionCallPayload(value) {
  if (!value || typeof value !== "object") return null;

  if (
    value.type === "function_call" &&
    typeof value.name === "string" &&
    typeof value.arguments === "string" &&
    typeof value.call_id === "string"
  ) {
    return {
      name: value.name,
      arguments: value.arguments,
      call_id: value.call_id,
    };
  }

  if (
    typeof value.name === "string" &&
    typeof value.arguments === "string" &&
    typeof value.call_id === "string"
  ) {
    return {
      name: value.name,
      arguments: value.arguments,
      call_id: value.call_id,
    };
  }

  return null;
}

function extractFunctionCallsFromResponse(response) {
  const calls = [];
  const output = response?.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const fc = toFunctionCallPayload(item);
      if (fc) calls.push(fc);
    }
  }
  return calls;
}

// ─── OpenAI Realtime Session ──────────────────────────────────────────────────
function createRealtimeSession(sessionId, onEvent) {
  const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
  const startMs = Date.now();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    });

    ws.on("open", () => {
      console.log(
        `[${sessionId}] OpenAI Realtime connected (${Date.now() - startMs}ms)`,
      );

      sendWsJson(ws, {
        type: "session.update",
        session: {
          type: "realtime",
          model: OPENAI_REALTIME_MODEL,
          output_modalities: ["text"],
          audio: {
            input: {
              format: {
                type: "audio/pcm",
                rate: OPENAI_INPUT_SAMPLE_RATE,
              },
              turn_detection: {
                type: "server_vad",
                threshold: OPENAI_VAD_THRESHOLD,
                prefix_padding_ms: OPENAI_VAD_PREFIX_PADDING_MS,
                silence_duration_ms: OPENAI_VAD_SILENCE_DURATION_MS,
              },
            },
          },
          instructions: getSystemPrompt(),
          tools: [getSaveCallLogTool()],
          tool_choice: "auto",
        },
      });

      const session = {
        ws,
        elevenLabsWs: null,
        elevenLabsReady: false,
        textBuffer: [],
        isResponseActive: false,
        onEvent,
        startMs,
        openAiConnectedMs: Date.now(),
        elevenLabsConnectedMs: null,
        greetingTriggeredMs: null,
        firstResponseCreatedMs: null,
        firstAudioDeltaLogged: false,
        processedCallIds: new Set(),
        recorder: new ConversationRecorder(sessionId),
        callLogs: [],
        // FIX: flag to prevent double-open races
        elevenLabsOpening: false,
      };

      sessions.set(sessionId, session);
      openElevenLabsStream(sessionId);
      resolve();
    });

    ws.on("message", async (data) => {
      try {
        const event = JSON.parse(data.toString());
        await handleRealtimeEvent(sessionId, event);
      } catch (err) {
        console.error(`[${sessionId}] Parse error:`, err.message);
      }
    });

    ws.on("error", (err) => {
      console.error(`[${sessionId}] OpenAI WS error:`, err.message);
      onEvent({ type: "error", error: { message: err.message } });
      reject(err);
    });

    ws.on("close", (code) => {
      console.log(`[${sessionId}] OpenAI WS closed: ${code}`);
      closeElevenLabsWs(sessionId);
      sessions.delete(sessionId);
      onEvent({ type: "session-closed" });
    });
  });
}

// ─── Audio helpers ────────────────────────────────────────────────────────────
function sendAudio(sessionId, base64Audio) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.recorder.addUserAudio(base64Audio);
  sendWsJson(session.ws, {
    type: "input_audio_buffer.append",
    audio: base64Audio,
  });
}

function triggerGreeting(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.greetingTriggeredMs = Date.now();
  console.log(
    `[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`,
  );
  sendWsJson(session.ws, { type: "response.create" });
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────

// FIX: private helper — actual WebSocket construction, always opens a fresh one
function _openNewElevenLabsStream(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  // Guard: another open is already in-flight for this session
  if (session.elevenLabsOpening) {
    console.log(`[${sessionId}] ElevenLabs open already in-flight, skipping`);
    return;
  }
  session.elevenLabsOpening = true;

  const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
  const elWs = new WebSocket(wsUrl);

  elWs.on("open", () => {
    // Abort if session was closed while we were connecting
    if (!sessions.has(sessionId) || session.elevenLabsWs !== elWs) {
      elWs.close();
      return;
    }

    console.log(`[${sessionId}] ElevenLabs connected`);
    session.elevenLabsConnectedMs = Date.now();
    session.elevenLabsOpening = false;

    elWs.send(
      JSON.stringify({
        text: " ",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true,
        },
        xi_api_key: ELEVENLABS_API_KEY,
      }),
    );

    session.elevenLabsReady = true;
    // Flush any text that accumulated while we were connecting
    for (const text of session.textBuffer) {
      if (elWs.readyState === WebSocket.OPEN) {
        elWs.send(JSON.stringify({ text, try_trigger_generation: true }));
      }
    }
    session.textBuffer = [];
  });

  elWs.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.audio) {
        session.recorder.addAgentAudio(msg.audio);
        session.onEvent({ type: "audio-delta", delta: msg.audio });
      }
    } catch {}
  });

  elWs.on("error", (err) => {
    console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
    session.elevenLabsOpening = false;
  });

  elWs.on("close", () => {
    if (session.elevenLabsWs === elWs) {
      session.elevenLabsReady = false;
      session.elevenLabsOpening = false;
    }
  });

  session.elevenLabsWs = elWs;
}

// FIX: openElevenLabsStream — wait for old WS to fully close before opening new one
function openElevenLabsStream(sessionId, force = false) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const oldWs = session.elevenLabsWs;

  if (!force) {
    // Non-forced: only open if nothing is alive or connecting
    if (
      oldWs &&
      (oldWs.readyState === WebSocket.OPEN ||
        oldWs.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    _openNewElevenLabsStream(sessionId);
    return;
  }

  // FIX: forced open (interruption) — always clear the text buffer immediately
  // so leftover tokens from the cancelled response never reach the new stream
  session.textBuffer = [];
  session.elevenLabsReady = false;

  if (
    !oldWs ||
    oldWs.readyState === WebSocket.CLOSED ||
    oldWs.readyState === WebSocket.CLOSING
  ) {
    // Nothing alive — open directly
    session.elevenLabsWs = null;
    session.elevenLabsOpening = false;
    _openNewElevenLabsStream(sessionId);
    return;
  }

  if (oldWs.readyState === WebSocket.CONNECTING) {
    // Still connecting — terminate immediately, then open
    session.elevenLabsWs = null;
    session.elevenLabsOpening = false;
    try {
      oldWs.terminate();
    } catch (_) {}
    _openNewElevenLabsStream(sessionId);
    return;
  }

  // FIX: OPEN — flush end signal, then wait for close event before opening new one
  // This ensures old audio chunks already sent to the client don't keep arriving
  // after the new stream starts producing its own chunks.
  session.elevenLabsWs = null;
  session.elevenLabsOpening = false;

  try {
    // Send end-of-stream so ElevenLabs flushes cleanly (non-blocking)
    oldWs.send(JSON.stringify({ text: "" }));
  } catch (_) {}

  oldWs.once("close", () => {
    // Only open if session still exists and no other stream already opened
    if (!sessions.has(sessionId)) return;
    const s = sessions.get(sessionId);
    if (s && !s.elevenLabsWs && !s.elevenLabsOpening) {
      _openNewElevenLabsStream(sessionId);
    }
  });

  // Safety: if close event doesn't fire within 800ms, open anyway
  setTimeout(() => {
    if (!sessions.has(sessionId)) return;
    const s = sessions.get(sessionId);
    if (s && !s.elevenLabsWs && !s.elevenLabsOpening) {
      console.warn(`[${sessionId}] ElevenLabs close timeout — forcing open`);
      _openNewElevenLabsStream(sessionId);
    }
  }, 800);

  try {
    oldWs.close();
  } catch (_) {}
}

function sendTextToElevenLabs(sessionId, text) {
  const session = sessions.get(sessionId);
  if (!session) return;
  if (
    session.elevenLabsWs?.readyState === WebSocket.OPEN &&
    session.elevenLabsReady
  ) {
    session.elevenLabsWs.send(
      JSON.stringify({ text, try_trigger_generation: true }),
    );
  } else {
    // Buffer only if the stream is warming up (not if it was intentionally cleared)
    session.textBuffer.push(text);
  }
}

function flushElevenLabsStream(sessionId) {
  const session = sessions.get(sessionId);
  if (session?.elevenLabsWs?.readyState === WebSocket.OPEN) {
    session.elevenLabsWs.send(JSON.stringify({ text: "" }));
  }
}

function closeElevenLabsWs(sessionId) {
  const session = sessions.get(sessionId);
  if (session?.elevenLabsWs) {
    try {
      if (session.elevenLabsWs.readyState === WebSocket.CONNECTING)
        session.elevenLabsWs.terminate();
      else if (session.elevenLabsWs.readyState === WebSocket.OPEN)
        session.elevenLabsWs.close();
    } catch {}
    session.elevenLabsWs = null;
    session.elevenLabsReady = false;
    session.elevenLabsOpening = false;
    session.textBuffer = [];
  }
}

// ─── Function call handler ────────────────────────────────────────────────────
async function handleFunctionCall(sessionId, eventOrItem) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const call = toFunctionCallPayload(eventOrItem);
  if (!call || call.name !== "save_call_log") return;

  const callId = typeof call.call_id === "string" ? call.call_id : null;
  if (callId && session.processedCallIds.has(callId)) return;
  if (callId) session.processedCallIds.add(callId);

  try {
    const args = JSON.parse(call.arguments);
    console.log(
      `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`,
    );

    const logId = uuidv4();
    const callLog = new CallLog({
      id: logId,
      sessionId,
      caller_name: args.caller_name || null,
      caller_phone: args.caller_phone || null,
      caller_email: args.caller_email || null,
      vehicle_interest: args.vehicle_interest || null,
      intent_category: args.intent_category,
      preferred_time: args.preferred_time || null,
      staff_requested: args.staff_requested || null,
      outcome: args.outcome,
      ai_summary: args.ai_summary || null,
      sentiment: args.sentiment || "neutral",
      confidence_score: args.confidence_score || null,
      escalated: args.escalated || false,
    });

    await callLog.save();
    session.callLogs.push({ id: logId, ...args });
    console.log(`[${sessionId}] Call log saved to MongoDB: ${logId}`);

    sendWsJson(session.ws, {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify({
          success: true,
          message: "Call log saved successfully.",
          log_id: logId,
          outcome: args.outcome,
        }),
      },
    });
    sendWsJson(session.ws, { type: "response.create" });
    session.onEvent({ type: "call-logged", data: args });
  } catch (err) {
    if (callId) session.processedCallIds.delete(callId);
    console.error(`[${sessionId}] Call log save failed:`, err.message);
  }
}

// ─── OpenAI Event handler ─────────────────────────────────────────────────────
async function handleRealtimeEvent(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return;

  switch (event.type) {
    case "session.created":
    case "session.updated":
      break;

    case "response.created":
      session.isResponseActive = true;
      if (!session.firstResponseCreatedMs) {
        session.firstResponseCreatedMs = Date.now();
      }
      // FIX: only open ElevenLabs if not already open/opening — prevents dual streams
      if (
        !session.elevenLabsWs ||
        (session.elevenLabsWs.readyState !== WebSocket.OPEN &&
          session.elevenLabsWs.readyState !== WebSocket.CONNECTING)
      ) {
        openElevenLabsStream(sessionId);
      }
      break;

    case "response.output_text.delta":
    case "response.text.delta":
      sendTextToElevenLabs(sessionId, event.delta);
      session.onEvent({ type: "transcript-delta", delta: event.delta });
      break;

    case "response.output_text.done":
    case "response.text.done":
      flushElevenLabsStream(sessionId);
      session.onEvent({ type: "transcript-done", transcript: event.text });
      break;

    case "response.done": {
      session.isResponseActive = false;
      const calls = extractFunctionCallsFromResponse(event.response);
      for (const fc of calls) await handleFunctionCall(sessionId, fc);
      break;
    }

    case "response.output_item.done":
      if (event.item) {
        const fc = toFunctionCallPayload(event.item);
        if (fc) await handleFunctionCall(sessionId, fc);
      }
      break;

    case "response.function_call_arguments.done":
      await handleFunctionCall(sessionId, event);
      break;

    // FIX: full interruption handling — cancel response, clear text buffer,
    // send end signal to ElevenLabs, then force-reopen a fresh stream
    case "input_audio_buffer.speech_started":
      console.log(`[${sessionId}] User interrupted — stopping AI voice`);

      if (session.isResponseActive) {
        sendWsJson(session.ws, { type: "response.cancel" });
        session.isResponseActive = false;
      }

      // Force-reopen ElevenLabs (clears textBuffer + waits for old close)
      openElevenLabsStream(sessionId, true);

      session.onEvent({ type: "speech-started" });
      break;

    case "conversation.item.input_audio_transcription.completed":
      session.onEvent({
        type: "user-transcript",
        transcript: event.transcript,
      });
      break;

    case "error":
      console.error(
        `[${sessionId}] OpenAI error:`,
        JSON.stringify(event.error),
      );
      session.onEvent({ type: "error", error: event.error });
      break;

    default:
      break;
  }
}

// ─── Close session ────────────────────────────────────────────────────────────
function closeSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    try {
      const result = session.recorder.saveToFile();
      session.onEvent({
        type: "recording-saved",
        data: {
          filename: result.filename,
          url: `/recordings/${result.filename}`,
        },
      });
    } catch (err) {
      console.error(`[${sessionId}] Recording save failed:`, err.message);
    }
    closeElevenLabsWs(sessionId);
    try {
      session.ws.close();
    } catch {}
    sessions.delete(sessionId);
    console.log(`[${sessionId}] Session closed`);
  }
}

// ─── Prewarm ──────────────────────────────────────────────────────────────────
function clearPrewarmState(sessionId) {
  const state = prewarmStates.get(sessionId);
  if (!state) return;
  clearTimeout(state.ttlTimer);
  prewarmStates.delete(sessionId);
}

function startPrewarm(sessionId, eventForwarder) {
  if (prewarmStates.has(sessionId)) return prewarmStates.get(sessionId).promise;

  const state = { promise: null, ready: false, failed: false, ttlTimer: null };

  state.promise = createRealtimeSession(sessionId, eventForwarder)
    .then(() => {
      state.ready = true;
      console.log(`[${sessionId}] Prewarm ready`);
    })
    .catch((err) => {
      state.failed = true;
      console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
      throw err;
    });

  state.ttlTimer = setTimeout(() => {
    if (!prewarmStates.has(sessionId)) return;
    console.log(`[${sessionId}] Prewarm TTL expired — closing idle session`);
    clearPrewarmState(sessionId);
    closeSession(sessionId);
  }, PREWARM_TTL_MS);

  prewarmStates.set(sessionId, state);
  return state.promise;
}

// ─── Event Forwarder ──────────────────────────────────────────────────────────
function buildEventForwarder(socket) {
  return (event) => {
    switch (event.type) {
      case "audio-delta":
        socket.emit("audio-delta", { delta: event.delta });
        break;
      case "transcript-delta":
        socket.emit("transcript-delta", { delta: event.delta });
        break;
      case "transcript-done":
        socket.emit("transcript-done", { transcript: event.transcript });
        break;
      case "user-transcript":
        socket.emit("user-transcript", { transcript: event.transcript });
        break;
      case "speech-started":
        socket.emit("speech-started", {});
        break;
      case "call-logged":
        socket.emit("call-logged", event.data);
        break;
      case "recording-saved":
        socket.emit("recording-saved", event.data);
        break;
      case "error":
        socket.emit("realtime-error", { error: event.error });
        break;
      case "session-closed":
        socket.emit("session-closed", {});
        break;
    }
  };
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  const forwarder = buildEventForwarder(socket);
  startPrewarm(socket.id, forwarder).catch(() => {});

  socket.on("start-session", async () => {
    const sessionId = socket.id;
    console.log(`[${sessionId}] Starting voice session`);
    try {
      let state = prewarmStates.get(sessionId);
      if (!state) {
        await startPrewarm(sessionId, forwarder);
        state = prewarmStates.get(sessionId);
      }
      if (state) {
        try {
          await state.promise;
          if (state.ready) {
            clearPrewarmState(sessionId);
            socket.emit("session-started", { sessionId });
            triggerGreeting(sessionId);
            return;
          }
        } catch {}
        clearPrewarmState(sessionId);
      }
      await createRealtimeSession(sessionId, forwarder);
      socket.emit("session-started", { sessionId });
      triggerGreeting(sessionId);
    } catch (err) {
      console.error(`[${sessionId}] Session start failed:`, err.message);
      socket.emit("realtime-error", {
        error: { message: "Failed to connect to AI service" },
      });
    }
  });

  socket.on("audio-chunk", (data) => {
    if (data?.audio) sendAudio(socket.id, data.audio);
  });

  socket.on("end-session", () => {
    console.log(`[${socket.id}] End session requested`);
    clearPrewarmState(socket.id);
    closeSession(socket.id);
    socket.emit("session-closed", {});
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    clearPrewarmState(socket.id);
    closeSession(socket.id);
  });
});

// ─── REST Endpoints ───────────────────────────────────────────────────────────
app.get("/api/call-logs", async (req, res) => {
  try {
    const logs = await CallLog.find().sort({ createdAt: -1 }).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch call logs" });
  }
});

app.get("/api/call-logs/intent/:intent", async (req, res) => {
  try {
    const logs = await CallLog.find({ intent_category: req.params.intent })
      .sort({ createdAt: -1 })
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch call logs" });
  }
});

app.get("/api/recordings", (req, res) => {
  const files = fs
    .readdirSync(RECORDINGS_DIR)
    .filter((f) => f.endsWith(".wav"));
  res.json(
    files.map((f) => ({
      filename: f,
      url: `/recordings/${f}`,
      size:
        (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(
          2,
        ) + " MB",
    })),
  );
});

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", sessions: sessions.size }),
);

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   BYD Fairfield — AI Voice Agent (OmniSuiteAI)               ║
║   Running on http://localhost:${PORT}                         ║
║                                                              ║
║   Model:          ${OPENAI_REALTIME_MODEL}                   ║
║   OpenAI API Key: ${OPENAI_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   ElevenLabs Key: ${ELEVENLABS_API_KEY ? "✓ Set" : "✗ Missing"}                             ║
║   Voice ID:       ${ELEVENLABS_VOICE_ID}                     ║
║   MongoDB:        ${MONGODB_URI ? "✓ Set" : "✗ Missing"}                             ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
