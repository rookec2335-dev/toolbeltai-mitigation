    const express = require("express");
    const cors = require("cors");
    const app = express();
    const PORT = 5000;

    app.use(cors());
    app.use(express.json());

    app.post("/generate-log", (req, res) => {
      const {
        jobNumber,
        technician,
        rooms,
        equipmentAdded,
        equipmentRemoved,
        notes,
        photoNotes
      } = req.body;

      const roomText = (rooms || []).map((r, i) => {
        const tempIn = r.tempIn || "-";
        const tempOut = r.tempOut || "-";
        const rhIn = r.rhIn || "-";
        const rhOut = r.rhOut || "-";
        let grainDep = "";
        if (r.tempIn && r.tempOut && !isNaN(Number(r.tempIn)) && !isNaN(Number(r.tempOut))) {
          const gd = Number(r.tempOut) - Number(r.tempIn);
          grainDep = `• Grain Depression: ${gd}°F`;
        }

        return `
🏠 ROOM ${i + 1}: ${r.name || "N/A"}
• Moisture: ${r.moisture || "-"}
• Temp IN: ${tempIn}°F   |   Temp OUT: ${tempOut}°F
• RH IN: ${rhIn}%        |   RH OUT: ${rhOut}%
${grainDep}
`;
      }).join("\n");

      const report = `
📌 JOB INFORMATION
• Job Number: ${jobNumber || "-"}
• Technician: ${technician || "-"}

${roomText || "No room data logged."}

🔧 EQUIPMENT ADDED
${(equipmentAdded && equipmentAdded.length > 0) ? equipmentAdded.join(", ") : "None"}

🔻 EQUIPMENT REMOVED
${(equipmentRemoved && equipmentRemoved.length > 0) ? equipmentRemoved.join(", ") : "None"}

📸 PHOTO NOTES
${photoNotes || "No photo notes"}

📝 GENERAL NOTES
${notes || "No notes entered"}

--- END OF LOG ---
Report auto-generated via ToolbeltAI Mitigation Logger
`;

      res.json({ report });
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
