// server/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(express.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple health-check route
app.get("/api/test", (req, res) => {
  res.json({ message: "API Working!" });
});

/**
 * POST /api/mitigation-summary
 * Body: { jobInfo, rooms, dryLogs, fieldNotes }
 */
app.post("/api/mitigation-summary", async (req, res) => {
  try {
    const { jobInfo, rooms, dryLogs, fieldNotes } = req.body || {};

    const {
      customerName = "",
      jobAddress = "",
      claimNumber = "",
      paymentStatus = "",
      waitingOnInsurance = "",
    } = jobInfo || {};

    const roomText =
      rooms && rooms.length
        ? rooms
            .map(
              (r, idx) => `
Room ${idx + 1}:
- Name: ${r.roomName || "N/A"}
- Moisture %: ${r.moisturePercent || "N/A"}
- Moisture details: ${r.moistureDetails || "N/A"}
- Room notes (what was removed/dried): ${r.roomNotes || "N/A"}`
            )
            .join("\n")
        : "No rooms were provided.";

    const dryLogText =
      dryLogs && dryLogs.length
        ? dryLogs
            .map(
              (d, idx) => `
Dry Log ${idx + 1}:
- Date: ${d.date || "N/A"}
- Room: ${d.room || "N/A"}
- Moisture %: ${d.moisture || "N/A"}
- Notes: ${d.notes || "N/A"}`
            )
            .join("\n")
        : "No daily dry logs were provided.";

    const extraNotes = fieldNotes || "None provided.";

    const prompt = `
You are a SENIOR WATER MITIGATION SUPERVISOR and also very familiar with
INSURANCE CARRIER expectations and Xactimate-style documentation.

Write a CLEAR, PROFESSIONAL mitigation narrative suitable to submit
directly to an adjuster.

IMPORTANT RULES:
- DO NOT mention payment status, money, invoices, or how the job is being paid.
- Focus on cause of loss, affected areas, mitigation actions, dry-down progress,
  and why mitigation was necessary to prevent further damage and mold.
- Use calm, factual, professional language.
- Write in 3rd person ("the mitigation team", "the technician").
- Include headings and short paragraphs so it is easy to read.

JOB INFO
- Customer Name: ${customerName}
- Job Address: ${jobAddress}
- Claim Number: ${claimNumber}
- Waiting on Insurance?: ${waitingOnInsurance}
- (Payment status is INTERNAL ONLY and must NOT appear in the narrative): ${paymentStatus}

ROOMS & MOISTURE READINGS
${roomText}

DAILY DRY LOGS
${dryLogText}

TECH / FIELD NOTES
${extraNotes}

Write one cohesive report that:
1. Briefly explains the situation & source of loss (you may infer a generic water loss if not given).
2. Describes conditions found in each room.
3. Explains why mitigation work was necessary from a supervisor perspective.
4. Summarizes drying progress based on the daily logs.
5. Mentions that photos and moisture documentation were captured.
6. Ends with a short conclusion that the home is trending back toward pre-loss condition.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || "";

    return res.json({ summary });
  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ error: "AI request failed" });
  }
});

/**
 * POST /api/psychrometric
 * Body: { dehuModel, inletTemp, inletRH, outletTemp, outletRH, roomNotes }
 *
 * AI will build a psychrometric-style table and explanation based on the
 * dehumidifier inlet/outlet conditions. This is to satisfy carrier
 * documentation (grain depression / efficiency narrative).
 */
app.post("/api/psychrometric", async (req, res) => {
  try {
    const {
      dehuModel = "",
      inletTemp = "",
      inletRH = "",
      outletTemp = "",
      outletRH = "",
      roomNotes = "",
    } = req.body || {};

    const prompt = `
You are a mitigation supervisor who understands PSYCHROMETRICS and how
carriers expect dehumidifier performance to be documented.

You are given basic dehumidifier conditions:

- Dehu Model: ${dehuModel || "Not specified"}
- Inlet (return air) temperature (°F): ${inletTemp || "N/A"}
- Inlet relative humidity (%): ${inletRH || "N/A"}
- Outlet (supply air) temperature (°F): ${outletTemp || "N/A"}
- Outlet relative humidity (%): ${outletRH || "N/A"}
- Room / equipment notes: ${roomNotes || "None provided"}

Tasks:

1. Estimate a simple psychrometric table that an adjuster can understand.
   You may approximate grains-per-pound (GPP) values based on typical
   psychrometric relationships. If exact calculation isn't possible,
   make a reasonable estimate and clearly label it "approx.".

   Produce something like (in plain text):

   Psychrometric Table (Approx.)
   -----------------------------------------------
   Parameter              | Inlet (Return) | Outlet (Supply)
   Dry Bulb Temp (°F)     | ...
   Relative Humidity (%)  | ...
   Grains per Pound (GPP) | ...
   Grain Depression       | ... (GPP diff)
   Notes                  | short note...

2. After the table, write 2–3 short paragraphs that:
   - Comment on whether the dehumidifier is performing effectively
     (based on grain depression and outlet conditions).
   - Explain in simple language why this data supports the mitigation
     strategy and is acceptable for insurance documentation.
   - Avoid math formulas; keep it practical and field-oriented.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
    });

    const table = completion.choices[0]?.message?.content || "";

    return res.json({ table });
  } catch (err) {
    console.error("PSYCHROMETRIC AI ERROR:", err);
    return res.status(500).json({ error: "Psychrometric AI request failed" });
  }
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
