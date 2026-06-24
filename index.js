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
// const PORT = process.env.BYD_VOICE_PORT || 4030;
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// const ELEVENLABS_VOICE_ID =
//   process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
// const MONGODB_URI = process.env.MONGODB_URI;
// const PREWARM_TTL_MS = 60_000;

// const OPENAI_REALTIME_MODEL =
//   process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
// const OPENAI_INPUT_SAMPLE_RATE = Number(
//   process.env.OPENAI_INPUT_SAMPLE_RATE || 24000,
// );
// const OPENAI_VAD_THRESHOLD = Number(process.env.OPENAI_VAD_THRESHOLD || 0.8);
// const OPENAI_VAD_PREFIX_PADDING_MS = Number(
//   process.env.OPENAI_VAD_PREFIX_PADDING_MS || 300,
// );
// const OPENAI_VAD_SILENCE_DURATION_MS = Number(
//   process.env.OPENAI_VAD_SILENCE_DURATION_MS || 2000,
// );

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
//     sentiment: {
//       type: String,
//       enum: ["positive", "neutral", "negative"],
//       default: "neutral",
//     },
//     confidence_score: { type: Number, default: null },
//     escalated: { type: Boolean, default: false },
//   },
//   { timestamps: true },
// );

// const CallLog = mongoose.model("BYDCallLog", callLogSchema);

// // ─── Recordings directory ─────────────────────────────────────────────────────
// const RECORDINGS_DIR = path.join(__dirname, "recordings");
// if (!fs.existsSync(RECORDINGS_DIR))
//   fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

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

// // ─── BYD Knowledge Base ───────────────────────────────────────────────────────
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
// function getSystemPrompt(carContext) {
//   // Build car-specific context block if provided
//   const carContextBlock = carContext
//     ? `
// =============================================================
// ACTIVE CAR CONTEXT — THIS IS THE PRIMARY VEHICLE OF INTEREST
// =============================================================
// The caller has opened this voice session from the ${carContext} page.
// They are SPECIFICALLY interested in the ${carContext}.
// - Lead ALL responses with ${carContext}-specific information first.
// - Proactively mention ${carContext} specs, pricing, and features when relevant.
// - Your opening greeting MUST reference the ${carContext} by name.
// - If asked about other models, answer briefly then steer back to the ${carContext}.
// =============================================================
// `
//     : "";

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
// ${carContextBlock}
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
// ${
//   carContext
//     ? `The caller is already on the ${carContext} page — greet them and confirm their interest in the ${carContext} immediately.

// Start: "Thanks for calling BYD Fairfield! I can see you're checking out the ${carContext} — great choice. How can I help you with it today?"

// Then: "And who am I speaking with?"`
//     : `Greet first. Ask for name early. One question at a time.

// Start: "Thanks for calling BYD Fairfield — you're through to the front desk. How can I help you today?"

// Then: "Great — and who am I speaking with?"`
// }

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
//         vehicle_interest: {
//           type: "string",
//           description:
//             "Vehicle model they enquired about e.g. 'BYD Seal Performance', 'Shark 6'",
//         },
//         intent_category: {
//           type: "string",
//           enum: [
//             "vehicle_inquiry",
//             "test_drive_booking",
//             "pricing_inquiry",
//             "trade_in_inquiry",
//             "finance_inquiry",
//             "service_booking",
//             "general_enquiry",
//             "staff_transfer",
//             "comparison_request",
//             "availability_check",
//             "no_transcript_admin",
//           ],
//         },
//         preferred_time: {
//           type: "string",
//           description: "Booked or preferred time slot",
//         },
//         staff_requested: {
//           type: "string",
//           description: "Staff member requested by name",
//         },
//         outcome: {
//           type: "string",
//           enum: [
//             "test_drive_booked",
//             "callback_scheduled",
//             "transferred",
//             "info_provided",
//             "brochure_sent",
//             "message_taken",
//             "escalated",
//             "quote_provided",
//           ],
//         },
//         ai_summary: {
//           type: "string",
//           description: "1–2 sentence summary of the call",
//         },
//         sentiment: {
//           type: "string",
//           enum: ["positive", "neutral", "negative"],
//         },
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
//     this.events.push({
//       type: "user",
//       time: Date.now() - this.startTime,
//       bytes: buf.length,
//     });
//   }

//   addAgentAudio(base64Pcm16) {
//     const buf = Buffer.from(base64Pcm16, "base64");
//     this.agentChunks.push(buf);
//     this.events.push({
//       type: "agent",
//       time: Date.now() - this.startTime,
//       bytes: buf.length,
//     });
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
//     const agentPcm = this._resample(
//       Buffer.concat(this.agentChunks),
//       16000,
//       OUTPUT_RATE,
//     );
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
//     console.log(
//       `[Recording] Saved: ${filename} (${(wav.length / 1024 / 1024).toFixed(2)} MB)`,
//     );
//     return {
//       filename,
//       filepath,
//       sizeMB: (wav.length / 1024 / 1024).toFixed(2),
//     };
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

//   if (
//     value.type === "function_call" &&
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return {
//       name: value.name,
//       arguments: value.arguments,
//       call_id: value.call_id,
//     };
//   }

//   if (
//     typeof value.name === "string" &&
//     typeof value.arguments === "string" &&
//     typeof value.call_id === "string"
//   ) {
//     return {
//       name: value.name,
//       arguments: value.arguments,
//       call_id: value.call_id,
//     };
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
// function createRealtimeSession(sessionId, onEvent, carContext) {
//   const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
//   const startMs = Date.now();

//   return new Promise((resolve, reject) => {
//     const ws = new WebSocket(url, {
//       headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//     });

//     ws.on("open", () => {
//       console.log(
//         `[${sessionId}] OpenAI Realtime connected (${Date.now() - startMs}ms)${carContext ? ` | Car context: ${carContext}` : ""}`,
//       );

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
//           // Pass carContext into the system prompt
//           instructions: getSystemPrompt(carContext || null),
//           tools: [getSaveCallLogTool()],
//           tool_choice: "auto",
//         },
//       });

//       const session = {
//         ws,
//         carContext: carContext || null,
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
//         elevenLabsOpening: false,
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
//   sendWsJson(session.ws, {
//     type: "input_audio_buffer.append",
//     audio: base64Audio,
//   });
// }

// // ─── Trigger greeting — car-context-aware ─────────────────────────────────────
// function triggerGreeting(sessionId) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   session.greetingTriggeredMs = Date.now();
//   console.log(
//     `[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`,
//   );

//   if (session.carContext) {
//     // Inject a hidden "user" conversation item so the model knows exactly which
//     // car page the caller opened — this primes the greeting without the caller
//     // having to say anything.
//     const primeMessage =
//       `The caller has just opened the voice assistant from the ${session.carContext} page. ` +
//       `They are interested in the ${session.carContext}. ` +
//       `Greet them warmly and reference the ${session.carContext} by name in your opening line.`;

//     sendWsJson(session.ws, {
//       type: "conversation.item.create",
//       item: {
//         type: "message",
//         role: "user",
//         content: [{ type: "input_text", text: primeMessage }],
//       },
//     });
//   }

//   sendWsJson(session.ws, { type: "response.create" });
// }

// // ─── ElevenLabs TTS ───────────────────────────────────────────────────────────

// function _openNewElevenLabsStream(sessionId) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   if (session.elevenLabsOpening) {
//     console.log(`[${sessionId}] ElevenLabs open already in-flight, skipping`);
//     return;
//   }
//   session.elevenLabsOpening = true;

//   const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
//   const elWs = new WebSocket(wsUrl);

//   elWs.on("open", () => {
//     if (!sessions.has(sessionId) || session.elevenLabsWs !== elWs) {
//       elWs.close();
//       return;
//     }

//     console.log(`[${sessionId}] ElevenLabs connected`);
//     session.elevenLabsConnectedMs = Date.now();
//     session.elevenLabsOpening = false;

//     elWs.send(
//       JSON.stringify({
//         text: " ",
//         voice_settings: {
//           stability: 0.5,
//           similarity_boost: 0.8,
//           style: 0.3,
//           use_speaker_boost: true,
//         },
//         xi_api_key: ELEVENLABS_API_KEY,
//       }),
//     );

//     session.elevenLabsReady = true;
//     for (const text of session.textBuffer) {
//       if (elWs.readyState === WebSocket.OPEN) {
//         elWs.send(JSON.stringify({ text, try_trigger_generation: true }));
//       }
//     }
//     session.textBuffer = [];
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

//   elWs.on("error", (err) => {
//     console.warn(`[${sessionId}] ElevenLabs error: ${err.message}`);
//     session.elevenLabsOpening = false;
//   });

//   elWs.on("close", () => {
//     if (session.elevenLabsWs === elWs) {
//       session.elevenLabsReady = false;
//       session.elevenLabsOpening = false;
//     }
//   });

//   session.elevenLabsWs = elWs;
// }

// function openElevenLabsStream(sessionId, force = false) {
//   const session = sessions.get(sessionId);
//   if (!session) return;

//   const oldWs = session.elevenLabsWs;

//   if (!force) {
//     if (
//       oldWs &&
//       (oldWs.readyState === WebSocket.OPEN ||
//         oldWs.readyState === WebSocket.CONNECTING)
//     ) {
//       return;
//     }
//     _openNewElevenLabsStream(sessionId);
//     return;
//   }

//   session.textBuffer = [];
//   session.elevenLabsReady = false;

//   if (
//     !oldWs ||
//     oldWs.readyState === WebSocket.CLOSED ||
//     oldWs.readyState === WebSocket.CLOSING
//   ) {
//     session.elevenLabsWs = null;
//     session.elevenLabsOpening = false;
//     _openNewElevenLabsStream(sessionId);
//     return;
//   }

//   if (oldWs.readyState === WebSocket.CONNECTING) {
//     session.elevenLabsWs = null;
//     session.elevenLabsOpening = false;
//     try {
//       oldWs.terminate();
//     } catch (_) {}
//     _openNewElevenLabsStream(sessionId);
//     return;
//   }

//   session.elevenLabsWs = null;
//   session.elevenLabsOpening = false;

//   try {
//     oldWs.send(JSON.stringify({ text: "" }));
//   } catch (_) {}

//   oldWs.once("close", () => {
//     if (!sessions.has(sessionId)) return;
//     const s = sessions.get(sessionId);
//     if (s && !s.elevenLabsWs && !s.elevenLabsOpening) {
//       _openNewElevenLabsStream(sessionId);
//     }
//   });

//   setTimeout(() => {
//     if (!sessions.has(sessionId)) return;
//     const s = sessions.get(sessionId);
//     if (s && !s.elevenLabsWs && !s.elevenLabsOpening) {
//       console.warn(`[${sessionId}] ElevenLabs close timeout — forcing open`);
//       _openNewElevenLabsStream(sessionId);
//     }
//   }, 800);

//   try {
//     oldWs.close();
//   } catch (_) {}
// }

// function sendTextToElevenLabs(sessionId, text) {
//   const session = sessions.get(sessionId);
//   if (!session) return;
//   if (
//     session.elevenLabsWs?.readyState === WebSocket.OPEN &&
//     session.elevenLabsReady
//   ) {
//     session.elevenLabsWs.send(
//       JSON.stringify({ text, try_trigger_generation: true }),
//     );
//   } else {
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
//       if (session.elevenLabsWs.readyState === WebSocket.CONNECTING)
//         session.elevenLabsWs.terminate();
//       else if (session.elevenLabsWs.readyState === WebSocket.OPEN)
//         session.elevenLabsWs.close();
//     } catch {}
//     session.elevenLabsWs = null;
//     session.elevenLabsReady = false;
//     session.elevenLabsOpening = false;
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
//     console.log(
//       `[${sessionId}] Saving call log | name: ${args.caller_name} | intent: ${args.intent_category} | outcome: ${args.outcome}`,
//     );

//     const logId = uuidv4();
//     const callLog = new CallLog({
//       id: logId,
//       sessionId,
//       caller_name: args.caller_name || null,
//       caller_phone: args.caller_phone || null,
//       caller_email: args.caller_email || null,
//       // Auto-populate vehicle_interest from carContext if AI didn't extract one
//       vehicle_interest: args.vehicle_interest || session.carContext || null,
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
//       if (
//         !session.elevenLabsWs ||
//         (session.elevenLabsWs.readyState !== WebSocket.OPEN &&
//           session.elevenLabsWs.readyState !== WebSocket.CONNECTING)
//       ) {
//         openElevenLabsStream(sessionId);
//       }
//       break;

//     case "response.output_text.delta":
//     case "response.text.delta":
//       sendTextToElevenLabs(sessionId, event.delta);
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

//       if (session.isResponseActive) {
//         sendWsJson(session.ws, { type: "response.cancel" });
//         session.isResponseActive = false;
//       }

//       openElevenLabsStream(sessionId, true);
//       session.onEvent({ type: "speech-started" });
//       break;

//     case "conversation.item.input_audio_transcription.completed":
//       session.onEvent({
//         type: "user-transcript",
//         transcript: event.transcript,
//       });
//       break;

//     case "error":
//       console.error(
//         `[${sessionId}] OpenAI error:`,
//         JSON.stringify(event.error),
//       );
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
//       session.onEvent({
//         type: "recording-saved",
//         data: {
//           filename: result.filename,
//           url: `/recordings/${result.filename}`,
//         },
//       });
//     } catch (err) {
//       console.error(`[${sessionId}] Recording save failed:`, err.message);
//     }
//     closeElevenLabsWs(sessionId);
//     try {
//       session.ws.close();
//     } catch {}
//     sessions.delete(sessionId);
//     console.log(`[${sessionId}] Session closed`);
//   }
// }

// // ─── Prewarm ──────────────────────────────────────────────────────────────────
// // NOTE: Prewarm sessions use no carContext (generic). When start-session is
// // called with a carContext, we cannot reuse the prewarm — a fresh session is
// // created so the system prompt is tailored to the specific car.
// function clearPrewarmState(sessionId) {
//   const state = prewarmStates.get(sessionId);
//   if (!state) return;
//   clearTimeout(state.ttlTimer);
//   prewarmStates.delete(sessionId);
// }

// function startPrewarm(sessionId, eventForwarder) {
//   if (prewarmStates.has(sessionId)) return prewarmStates.get(sessionId).promise;

//   const state = { promise: null, ready: false, failed: false, ttlTimer: null };

//   // Prewarm with no carContext — generic prompt
//   state.promise = createRealtimeSession(sessionId, eventForwarder, null)
//     .then(() => {
//       state.ready = true;
//       console.log(`[${sessionId}] Prewarm ready`);
//     })
//     .catch((err) => {
//       state.failed = true;
//       console.warn(`[${sessionId}] Prewarm failed: ${err.message}`);
//       throw err;
//     });

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
//       case "audio-delta":
//         socket.emit("audio-delta", { delta: event.delta });
//         break;
//       case "transcript-delta":
//         socket.emit("transcript-delta", { delta: event.delta });
//         break;
//       case "transcript-done":
//         socket.emit("transcript-done", { transcript: event.transcript });
//         break;
//       case "user-transcript":
//         socket.emit("user-transcript", { transcript: event.transcript });
//         break;
//       case "speech-started":
//         socket.emit("speech-started", {});
//         break;
//       case "call-logged":
//         socket.emit("call-logged", event.data);
//         break;
//       case "recording-saved":
//         socket.emit("recording-saved", event.data);
//         break;
//       case "error":
//         socket.emit("realtime-error", { error: event.error });
//         break;
//       case "session-closed":
//         socket.emit("session-closed", {});
//         break;
//     }
//   };
// }

// // ─── Socket.IO ────────────────────────────────────────────────────────────────
// io.on("connection", (socket) => {
//   console.log(`Client connected: ${socket.id}`);
//   const forwarder = buildEventForwarder(socket);

//   // Prewarm immediately on connection (generic, no car context)
//   startPrewarm(socket.id, forwarder).catch(() => {});

//   socket.on("start-session", async (data) => {
//     const sessionId = socket.id;
//     // ── NEW: accept carContext from the client ────────────────────────────
//     const carContext = data?.carContext || null;
//     console.log(
//       `[${sessionId}] Starting voice session${carContext ? ` | Car: ${carContext}` : ""}`,
//     );

//     try {
//       if (carContext) {
//         // Car context present → cannot reuse generic prewarm session.
//         // Close any prewarm, then open a fresh car-specific session.
//         clearPrewarmState(sessionId);
//         closeSession(sessionId);

//         await createRealtimeSession(sessionId, forwarder, carContext);
//         socket.emit("session-started", { sessionId });
//         triggerGreeting(sessionId);
//         return;
//       }

//       // No car context — try to reuse prewarm as before
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

//       await createRealtimeSession(sessionId, forwarder, null);
//       socket.emit("session-started", { sessionId });
//       triggerGreeting(sessionId);
//     } catch (err) {
//       console.error(`[${sessionId}] Session start failed:`, err.message);
//       socket.emit("realtime-error", {
//         error: { message: "Failed to connect to AI service" },
//       });
//     }
//   });

//   socket.on("audio-chunk", (data) => {
//     if (data?.audio) sendAudio(socket.id, data.audio);
//   });

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
//     const logs = await CallLog.find({ intent_category: req.params.intent })
//       .sort({ createdAt: -1 })
//       .lean();
//     res.json(logs);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch call logs" });
//   }
// });

// app.get("/api/recordings", (req, res) => {
//   const files = fs
//     .readdirSync(RECORDINGS_DIR)
//     .filter((f) => f.endsWith(".wav"));
//   res.json(
//     files.map((f) => ({
//       filename: f,
//       url: `/recordings/${f}`,
//       size:
//         (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024 / 1024).toFixed(
//           2,
//         ) + " MB",
//     })),
//   );
// });

// app.get("/api/health", (req, res) =>
//   res.json({ status: "ok", sessions: sessions.size }),
// );

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

// ─── BYD Full Knowledge Base ──────────────────────────────────────────────────
const BYD_KNOWLEDGE_BASE = `
BYD VEHICLE KNOWLEDGE BASE

=== BYD ATTO 1 ===
The BYD Atto 1 is a compact electric SUV designed for everyday practicality. It combines modern styling, smart technology, and efficient electric performance.

KEY FEATURES:
- All-Electric Performance: Efficient electric driving with BYD Blade Battery technology
- Technology-Focused Interior: Touchscreen infotainment system with Apple CarPlay and Android Auto connectivity
- Everyday Practicality: Compact SUV design with flexible interior space and modern convenience features
- Advanced Safety Systems: Includes driver assistance and active safety technologies

MODELS:
ATTO 1 ESSENTIAL - $23,990 LIST / $27,122.95 D/A
- Exterior: 15" Wheels with Tyre Repair Kit, LED Daytime Running Lights, Electrically Adjustable Side Mirrors, Rear Spoiler
- Interior: Vegan Leather Interior Trim, 7" Digital Driver Display, 10.1" Touchscreen Infotainment
- Colors: Apricity White, Cosmos Black, Pine Lime, Arctic Blue (Non Standard Paint +$500)
- Specs: 30kWh Blade Battery, 65kW/135Nm, 15" Alloy Wheels, 220km WLTP Range, 11.1s acceleration

ATTO 1 PREMIUM - $27,990 LIST / $31,290.95 D/A
- Exterior: Larger Alloy Wheels, Premium Exterior Styling Accents, Privacy Rear Glass, LED Lighting Enhancements
- Interior: Heated Front Seats, Electrically Adjustable Front Seats, 4-Way Adjustable Steering Column
- Technology: Wireless Phone Charging, 360-Degree Camera System, Enhanced Audio System, Automatic Climate Control, Multifunction Steering Wheel
- Specs: 43.2kWh Blade Battery, 115kW/180Nm, 16" Alloy Wheels, 310km WLTP Range, 9.1s acceleration

SAFETY FEATURES (Both Models):
- Adaptive Cruise Control, Autonomous Emergency Braking, Lane Keeping Assist
- Rear View Camera, Rear Parking Sensors, 6 Airbags

=== BYD ATTO 2 ===
The BYD Atto 2 brings compact electric SUV practicality together with everyday comfort, connected technology, and efficient electric performance.

KEY FEATURES:
- All-Electric Performance: 130kW electric powertrain with BYD Blade Battery technology and up to 345km WLTP driving range
- Technology-Focused Interior: Rotating touchscreen infotainment system with Apple CarPlay, Android Auto, and digital driver display
- Everyday Practicality: Compact SUV design with flexible interior space, split-fold rear seating, and modern convenience features
- Advanced Safety Systems: Includes driver assistance and active safety technologies

MODELS:
ATTO 2 DYNAMIC - $31,990 LIST / $35,458.95 D/A
- Exterior: 16" Alloy Wheels, LED Daytime Running Lights, Electrically Adjustable Side Mirrors, Rear Spoiler
- Interior: Vegan Leather Interior Trim, Digital Driver Display, Rotating Touchscreen Infotainment System, Automatic Climate Control, Multifunction Steering Wheel, Split-Fold Rear Seats
- Technology: Apple CarPlay & Android Auto, Voice Control ("Hi BYD"), Over-the-Air (OTA) Updates, Smart Key with Push Button Start, Vehicle-to-Load (V2L) Capability, USB Charging Ports
- Safety: Intelligent Adaptive Cruise Control, Autonomous Emergency Braking (AEB), Blind Spot Detection, Lane Departure Keeping Assist, Emergency Lane Keeping Assist, Rear Cross Traffic Alert with Braking, Forward & Rear Collision Warning, Traffic Sign Recognition, Rear Parking Sensors, Electronic Stability Control (ESC), Airbags
- Colors: Ski White, Mist Grey, Harbour Grey, Cosmos Black (Non Standard Paint +$600)
- Specs: 51.13kWh Blade Battery, 130kW/290Nm, 16" Alloy Wheels, 345km WLTP Range, 7.9s acceleration

ATTO 2 PREMIUM - $35,990 LIST / $39,626.95 D/A
- Exterior: 17" Alloy Wheels, Auto-Folding Side Mirrors, Panoramic Glass Roof (fixed)
- Interior: Heated Front Seats, Ventilated Front Seats, Power Adjustable Front Seats
- Technology: Wireless Phone Charging, 360-Degree Camera System, 8-Speaker Audio System
- Safety: Front Parking Sensors
- Specs: 51.13kWh Blade Battery, 130kW/290Nm, 17" Alloy Wheels, 345km WLTP Range, 7.9s acceleration

=== BYD ATTO 3 ===
The BYD Atto 3 combines fully electric performance with practical SUV functionality, offering a balance of everyday usability, connected technology, and efficient driving.

KEY FEATURES:
- Responsive Electric Driving: 150kW electric drivetrain with BYD Blade Battery technology and up to 420km WLTP driving range (Premium)
- Connected Digital Cabin: Rotating touchscreen infotainment, digital driver display, voice control, Apple CarPlay, and Android Auto
- Everyday SUV Practicality: Compact SUV design with flexible interior space, rear cargo versatility, and everyday comfort features
- Driver Assistance Technology: Includes adaptive cruise control, lane support systems, and autonomous emergency braking

MODELS:
ATTO 3 ESSENTIAL - $39,990 LIST / $43,794.95 D/A
- Exterior: Alloy Wheels, LED Headlights, LED Daytime Running Lights, Rear Spoiler
- Interior: Vegan Leather Interior Trim, Electrically Adjustable Front Seats, 12.8" Rotating Touchscreen Infotainment System, Digital Driver Display, Automatic Climate Control, Multifunction Steering Wheel, Split-Fold Rear Seats
- Technology: Apple CarPlay & Android Auto, Voice Control ("Hi BYD"), Over-the-Air (OTA) Updates, Keyless Entry & Push Button Start, Vehicle-to-Load (V2L) Capability, USB Charging Ports
- Safety: Intelligent Adaptive Cruise Control, Autonomous Emergency Braking (AEB), Blind Spot Detection, Lane Departure Warning & Lane Keeping Assist, Rear Cross Traffic Alert, Traffic Sign Recognition, Front & Rear Parking Sensors, Electronic Stability Control (ESC), 7 Airbags
- Colors: White, Black, Grey (Atlantis Grey only available on Premium)
- Specs: 72.8 kWh Battery, 150kW/310Nm, FWD, 420km WLTP Range, 7.9s acceleration, 440L boot space (up to 1,340L with seats folded)

ATTO 3 PREMIUM - Higher trim with additional features like panoramic sunroof, electric tailgate, wireless phone charging

=== BYD SEAL ===
The BYD Seal is a fully electric sports sedan that combines sleek styling, rapid performance, and advanced technology.

KEY FEATURES:
- All-Electric Performance: Available with rear-wheel drive or dual-motor all-wheel drive powertrains, delivering strong acceleration and up to 570km WLTP driving range
- Premium Technology Interior: Modern cabin featuring BYD's rotating touchscreen infotainment system, digital driver display, Apple CarPlay, Android Auto, and wireless connectivity
- Aerodynamic Sedan Design: Sleek sports sedan styling combined with a spacious cabin, refined comfort, and everyday practicality
- Advanced Safety Systems: Includes adaptive cruise control, lane keeping assistance, blind spot monitoring, autonomous emergency braking, and advanced driver assistance technology

MODELS:
SEAL PREMIUM - $52,990 LIST / $57,340.95 D/A
- Exterior: 19" Alloy Wheels, Panoramic Glass Roof, Flush Door Handles, Premium Exterior Styling, Full LED Lighting System
- Interior: Premium Interior Trim, Heated & Ventilated Front Seats, Electrically Adjustable Front Seats, Driver Seat Memory Function, Ambient Interior Lighting, Head-Up Display (HUD)
- Technology: 15.6" Rotating Touchscreen Infotainment System, Wireless Apple CarPlay & Android Auto, Wireless Phone Charging, Digital Driver Instrument Display, Over-the-Air (OTA) Updates, Keyless Entry & Push Button Start, 360° Camera System, USB Charging Ports, Connected Vehicle Functionality
- Performance: 230kW Rear-Wheel Drive Electric Powertrain, Extended Driving Range Battery System, Fast DC Charging Capability, Sport & Performance Drive Modes, Vehicle-to-Load (V2L) Capability
- Safety: Adaptive Cruise Control, Blind Spot Monitoring, Lane Keeping Assistance, Autonomous Emergency Braking, Front & Rear Parking Sensors, Rear Cross Traffic Alert, Traffic Sign Recognition, Electronic Stability Control (ESC), Multiple Airbag System
- Colors: Atlantis Grey, Cosmos Black, Aurora White, Shark Grey (Non Standard Paint: Shark Grey +$1500, Shark Grey +$2000)
- Specs: 82.5kWh Blade Battery, 230kW/360Nm, RWD, 570km WLTP Range, 5.9s 0-100km/h

SEAL PERFORMANCE - $61,990 LIST / $66,718.95 D/A
- Exterior: Exclusive Performance Badging, Red Performance Brake Calipers
- Interior: Heated Steering Wheel
- Performance: Dual-Motor All-Wheel Drive System, 390kW Total Power Output, Faster 0-100km/h Performance, BYD DiSus-C Adaptive Damping System, Enhanced AWD Traction & Stability, Improved High-Speed & Cornering Performance
- Specs: 82.5kWh Blade Battery, 390kW/670Nm, AWD, 520km WLTP Range, 3.8s 0-100km/h

=== BYD SHARK 6 ===
The BYD Shark 6 blends plug-in hybrid efficiency with genuine dual-cab utility, delivering strong performance, advanced technology, and everyday practicality.

KEY FEATURES:
- Electrified AWD Capability: Plug-In Hybrid AWD System, BYD Blade Battery Technology, Terrain Driving Modes, Regenerative Braking
- Connected Technology: Touchscreen Infotainment System, Apple CarPlay & Android Auto, Digital Driver Display, Voice Control Functionality
- Safety & Driver Assistance: Adaptive Cruise Control, Autonomous Emergency Braking, Lane Support Systems, Blind Spot Monitoring, Parking Assistance Technology
- Utility & Practicality: Dual-Cab Utility Platform, Vehicle-to-Load (V2L) Capability, Towing Capability, Spacious Interior Layout

MODELS:
SHARK 6 PREMIUM - $57,900 LIST / $61,680.95 D/A
- Exterior: Alloy Wheels, Roof Rails, Side Steps, Factory Tub Configuration
- Interior: Premium Interior Trim, Electrically Adjustable Front Seats, 15.6" Rotating Touchscreen Infotainment System, Automatic Climate Control, Rear Air Vents
- Technology: Over-the-Air (OTA) Updates, Keyless Entry & Push Button Start, USB Charging Ports, Wireless Connectivity Features, 360° Camera System
- Capability: 321kW Power Output, 650Nm Torque, Hill Descent Control, 2,500kg Braked Towing Capacity
- Safety: Rear Cross Traffic Alert, Traffic Sign Recognition, Front & Rear Parking Sensors, Electronic Stability Control (ESC), Multiple Airbag System
- Colors: Great White, Mist Grey, Tidal Black, Deep Sea Blue, Outback Orange (Mist Grey only available on Premium)
- Specs: 1.5L Turbo Plug-In Hybrid, 321kW/650Nm, AWD, 800km combined range, 5.7s 0-100km/h

SHARK 6 DYNAMIC - $59,990 LIST / $65,877.45 D/A (Inc BYD Tray)
- Exterior: Cab-Chassis Configuration, Custom Tray Compatibility, Work-Focused Exterior Design
- Interior: Durable Interior Trim, 12.8" Touchscreen Infotainment System
- Capability: 321kW Power Output, 650Nm Torque, 2,500kg Braked Towing Capacity, Trade & Fleet-Focused Configuration, Lighter Platform for Work Applications

SHARK 6 PERFORMANCE - $62,900 LIST / $66,815.95 D/A
- Exterior: Unique Performance Exterior Styling, Exclusive Performance Badging
- Interior: Performance Interior Trim Accents
- Performance: 2.0L Turbo Plug-In Hybrid System, 350kW Power Output, 700Nm Torque, Faster 0-100km/h Performance, Crawl Mode, 3,500kg Braked Towing Capacity, Enhanced Heavy-Load Capability, Improved Touring & Towing Performance
- Specs: 2.0L Turbo Plug-In Hybrid, 350kW/700Nm, AWD, 5.5s 0-100km/h

=== BYD SEALION 7 ===
The BYD Sealion 7 is an all-electric SUV with enhanced practicality and premium features.

KEY FEATURES:
- Enhanced practicality with V2L technology allowing you to power a wide range of appliances
- 150kW DC fast charge capability
- Sporty, futuristic design
- Keyless entry and start, NFC card key access, one-touch open/close tailgate
- OTA updates for latest features
- Super spacious cabin with 500L rear trunk capacity and 58L front trunk capacity
- Premium leather interior with 8-way power adjustable drivers seat, 4-way adjustable drivers lumbar support, power adjustable drivers leg rest and driver seat position memory
- Front passengers enjoy heated & ventilated seats while rear passengers can enjoy heated seats
- Electronic sunshade, dual-zone climate control with rear vents, DYNAUDIO premium 12 speaker sound system
- Wireless phone charging pad, Apple Carplay and Android Auto, 15.6-inch intelligent rotating touch screen and 10.5-inch LCD instrument display
- Advanced safety features including Adaptive Cruise Control, Lane Keeping Control, Lane Departure Warning, Traffic Sign Recognition, Automatic Emergency Braking, Front & Rear Cross Traffic Alert (with braking), Blind Spot Detection, Driver Attention Warning, Head-up display (W-HUD)

MODELS:
SEALION 7 PREMIUM
- 6.7s acceleration, 230 kW power, 456 km WLTP range

SEALION 7 PERFORMANCE
- 4.5s acceleration, 390kW power, 456 km WLTP range, 390kW of power and 690Nm of torque through an intelligent AWD system
- Includes intelligent Frequency Selective Damping (FSD) shock absorbers

COLORS: Aurora White, Shark Grey, Cosmos Black, Atlantis Grey

=== BYD SEALION 6 ===
The BYD Sealion 6 is a plug-in hybrid SUV with premium quality features.

KEY FEATURES:
- BYD DM-i technology is a PHEV system that uses a high-power motor drive and large-capacity BYD Blade battery as its primary source of power
- Can drive fully electric and when the SOC is low, the car transforms into an ultra-low fuel consumption hybrid vehicle
- Premium leather interior with 8-way power adjustable drivers seat (Premium), 6-way power adjustable driver seat (Essential) and 4-way power adjustable passenger seat
- Front passengers enjoy heated & ventilated seats
- Rear passengers ride in comfort with manually adjustable backrest angle, dual-zone climate control with rear vents, Infinity audio 10 speaker sound system
- 2x Wireless phone charging pads, Apple Carplay and Android Auto, 15.6-inch (Premium) / 12.8-inch (Essential) intelligent rotating touch screen and 12.3-inch LCD instrument display
- Keyless entry and go, with NFC card and BYD digital key included
- Safety features include blind spot detection, 360° cameras, Adaptive Cruise Control, Autonomous Emergency Braking, Lane Departure Warning, rear parking sensors (4 zone), front parking sensors (2 zone)

MODELS:
ESSENTIAL
- 8.5s Acceleration, 160 kW power, FWD Drivetrain

DYNAMIC EXTENDED
- 8.9s Acceleration, FWD Drivetrain, 160 kW Maximum power

COLORS: Arctic White, Stone Grey, Harbour Grey, Cosmos Black

=== BYD SEALION 8 ===
The BYD Sealion 8 is a Super Hybrid 7-seat SUV.

KEY FEATURES:
- Comfort for everyone with power adjustable heated and ventilated front seats
- Three-zone climate control with air vents across all three rows
- Premium takes luxury to the next level, with genuine premium leather upholstery and a 10-point massage function for the front seats and two middle-row outboard seats
- Those two middle-row seats also score heating and ventilation
- 26-inch ultra-wide heads-up display, 10.25-inch digital driver's display, and 15.6-inch infotainment screen
- First BYD in Australia to offer Nap, Camping, and Car Wash mode
- 9 airbags with curtains that extend to the third row, body made of TRB hot-stamped steel for outstanding rigidity and protection
- Latest ADAS systems and internal RGB-and-IR camera system continuously monitors the driver's posture, seatbelt status and more

MODELS:
SEALION 8 DYNAMIC FWD
- 205 kW power, 152 km Electric range NEDC, 8.6s acceleration

SEALION 8 DYNAMIC AWD
- 359 kW power, 152 km Electric range NEDC, 4.9s acceleration

SEALION 8 PREMIUM AWD
- 359 kW power, 152 km Electric range NEDC, 4.9s acceleration

POWERTRAIN OPTIONS:
- DM-i for efficient and intelligent driving
- DM-p for the ultimate performance with intelligent motor decoupling
- DM-p all-wheel drive offers fuel consumption as low as 1.0L/100km (NEDC cycle, with sufficient SOC)
- Sport mode unlocks 359kW/675Nm of grunt and 0-100km/h completed in just 4.9 seconds
- DiSus-C adaptive suspension technology that actively adjusts damping in milliseconds
- Second-generation Blade Battery in either 19kWh (DM-i) or 35.6kWh (DM-p) capacities

COLORS: Aurora White, Ridge Grey, Cosmos Black, Dark Aquamarine

=== BYD SEALION 5 ===
The BYD Sealion 5 is a plug-in hybrid SUV.

KEY FEATURES:
- BYD DM-i technology is a PHEV system that uses a high-power motor drive and large-capacity BYD Blade battery
- Premium leather interior with power adjustable seats
- Heated & ventilated front seats
- Wireless phone charging, Apple Carplay and Android Auto
- 15.6-inch intelligent rotating touch screen
- Advanced safety features

COLORS: Arctic White, Stone Grey, Harbour Grey, Cosmos Black

=== BYD DOLPHIN ===
The BYD Dolphin is an all-electric hatchback with ocean-inspired design.

KEY FEATURES:
- City dweller: small and nimble design makes it the perfect city vehicle
- Ocean-inspired design blends elegant curves, sharp crease lines and flowing contours, helping reduce drag and increase battery efficiency
- Super spacious with 345L trunk capacity that can be extended to 1,310L with rear seats folded
- Seat 5 people with ease over smaller trips
- Continuous LED headlight and dynamic tailight design
- Synthetic leather-wrapped seats with 6-way power adjustable driver's seat, 4-way power adjustable front passenger seat, driver and front passenger heated seats, 60/40 split rear folding seats
- Premium includes extra quality-of-life features such as a panoramic glass roof, rain sensing wipers, wireless phone charger
- Advanced safety features including Adaptive Cruise Control, Lane Keeping Support, Lane Departure Assist, Automatic Emergency Braking, Front & Rear Cross Traffic Alert (with braking), Blind Spot Detection, 360° cameras, ISOFIX child restraint anchor points
- 80kW (Premium model only) DC fast charge capabilities replenish the battery from 30% to 80% in just 29 minutes
- V2L technology, allowing 3.3kW of power, making DOLPHIN a versatile mobile power station

MODELS:
BYD DOLPHIN ESSENTIAL
- 12.3s acceleration, 70 kW power, 427 km WLTP range

BYD DOLPHIN PREMIUM
- 7.0s acceleration, 150 kW power, 427 km WLTP range

COLORS FOR ESSENTIAL: Ski White, Atlantis Grey, Harbour Grey
COLORS FOR PREMIUM: Ski White, Atlantis Grey, Harbour Grey, Ski White + Harbour Grey

=== BYD FAIRFIELD DEALERSHIP ===
BYD Australia is part of one of the world's leading electric vehicle and battery technology manufacturers, focused on delivering innovative, efficient, and technology-driven vehicles to Australian drivers.

At BYD Fairfield, our team is committed to helping customers explore the BYD range with clear product guidance, test drives, and ongoing support. As an authorised BYD dealership, we provide access to the latest BYD vehicles, servicing, and genuine parts in a modern showroom environment.

CONTACT INFORMATION:
- Website: www.bydfairfield.com.au
- Phone: 03 4110 8888
- Address: 415 Heidelberg Road, Fairfield Vic 3078

=== BYD TECHNOLOGY OVERVIEW ===
BLADE BATTERY: BYD's proprietary battery technology known for safety and efficiency
V2L (Vehicle-to-Load): Technology that allows the vehicle to power external devices
OTA (Over-the-Air) Updates: Wireless software updates for vehicle features
e-Platform 3.0: BYD's dedicated electric vehicle platform
DiPilot: BYD's advanced driver assistance system
DiSus-C: Adaptive damping suspension technology
DM-i: Intelligent plug-in hybrid system for efficiency
DM-p: Performance-oriented plug-in hybrid system with all-wheel drive
WARRANTY: 6 years vehicle / 8 years or 160,000km battery
`.trim();

// ─── System Prompt ────────────────────────────────────────────────────────────
function getSystemPrompt(carContext) {
  const carContextBlock = carContext
    ? `
=============================================================
ACTIVE CAR CONTEXT — THIS IS THE PRIMARY VEHICLE OF INTEREST
=============================================================
The caller has opened this voice session from the ${carContext} page.
They are SPECIFICALLY interested in the ${carContext}.
- Lead ALL responses with ${carContext}-specific information first.
- Proactively mention ${carContext} specs, pricing, and features when relevant.
- Your opening greeting MUST reference the ${carContext} by name.
- If asked about other models, answer briefly then steer back to the ${carContext}.
=============================================================
`
    : "";

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
${carContextBlock}
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
${BYD_KNOWLEDGE_BASE}

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
${
  carContext
    ? `The caller is already on the ${carContext} page — greet them and confirm their interest in the ${carContext} immediately.

Start: "Thanks for calling BYD Fairfield! I can see you're checking out the ${carContext} — great choice. How can I help you with it today?"

Then: "And who am I speaking with?"`
    : `Greet first. Ask for name early. One question at a time.

Start: "Thanks for calling BYD Fairfield — you're through to the front desk. How can I help you today?"

Then: "Great — and who am I speaking with?"`
}

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
function createRealtimeSession(sessionId, onEvent, carContext) {
  const url = `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`;
  const startMs = Date.now();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    });

    ws.on("open", () => {
      console.log(
        `[${sessionId}] OpenAI Realtime connected (${Date.now() - startMs}ms)${carContext ? ` | Car context: ${carContext}` : ""}`,
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
          instructions: getSystemPrompt(carContext || null),
          tools: [getSaveCallLogTool()],
          tool_choice: "auto",
        },
      });

      const session = {
        ws,
        carContext: carContext || null,
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

// ─── Trigger greeting — car-context-aware ─────────────────────────────────────
function triggerGreeting(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.greetingTriggeredMs = Date.now();
  console.log(
    `[${sessionId}] Greeting triggered (${session.greetingTriggeredMs - session.startMs}ms)`,
  );

  if (session.carContext) {
    const primeMessage =
      `The caller has just opened the voice assistant from the ${session.carContext} page. ` +
      `They are interested in the ${session.carContext}. ` +
      `Greet them warmly and reference the ${session.carContext} by name in your opening line.`;

    sendWsJson(session.ws, {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: primeMessage }],
      },
    });
  }

  sendWsJson(session.ws, { type: "response.create" });
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────

function _openNewElevenLabsStream(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (session.elevenLabsOpening) {
    console.log(`[${sessionId}] ElevenLabs open already in-flight, skipping`);
    return;
  }
  session.elevenLabsOpening = true;

  const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream-input?model_id=eleven_multilingual_v2&output_format=pcm_16000`;
  const elWs = new WebSocket(wsUrl);

  elWs.on("open", () => {
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

function openElevenLabsStream(sessionId, force = false) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const oldWs = session.elevenLabsWs;

  if (!force) {
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

  session.textBuffer = [];
  session.elevenLabsReady = false;

  if (
    !oldWs ||
    oldWs.readyState === WebSocket.CLOSED ||
    oldWs.readyState === WebSocket.CLOSING
  ) {
    session.elevenLabsWs = null;
    session.elevenLabsOpening = false;
    _openNewElevenLabsStream(sessionId);
    return;
  }

  if (oldWs.readyState === WebSocket.CONNECTING) {
    session.elevenLabsWs = null;
    session.elevenLabsOpening = false;
    try {
      oldWs.terminate();
    } catch (_) {}
    _openNewElevenLabsStream(sessionId);
    return;
  }

  session.elevenLabsWs = null;
  session.elevenLabsOpening = false;

  try {
    oldWs.send(JSON.stringify({ text: "" }));
  } catch (_) {}

  oldWs.once("close", () => {
    if (!sessions.has(sessionId)) return;
    const s = sessions.get(sessionId);
    if (s && !s.elevenLabsWs && !s.elevenLabsOpening) {
      _openNewElevenLabsStream(sessionId);
    }
  });

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
      vehicle_interest: args.vehicle_interest || session.carContext || null,
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

    case "input_audio_buffer.speech_started":
      console.log(`[${sessionId}] User interrupted — stopping AI voice`);

      if (session.isResponseActive) {
        sendWsJson(session.ws, { type: "response.cancel" });
        session.isResponseActive = false;
      }

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

  state.promise = createRealtimeSession(sessionId, eventForwarder, null)
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

  socket.on("start-session", async (data) => {
    const sessionId = socket.id;
    const carContext = data?.carContext || null;
    console.log(
      `[${sessionId}] Starting voice session${carContext ? ` | Car: ${carContext}` : ""}`,
    );

    try {
      if (carContext) {
        clearPrewarmState(sessionId);
        closeSession(sessionId);

        await createRealtimeSession(sessionId, forwarder, carContext);
        socket.emit("session-started", { sessionId });
        triggerGreeting(sessionId);
        return;
      }

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

      await createRealtimeSession(sessionId, forwarder, null);
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
