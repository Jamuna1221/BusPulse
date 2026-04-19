import {
  generateAdminReport,
  getAdminReportById,
  getAdminReportsOverview,
} from "../repositories/adminReports.repository.js";

export async function getAdminReportsOverviewController(req, res) {
  try {
    const data = await getAdminReportsOverview();
    res.json({ success: true, data });
  } catch (error) {
    console.error("getAdminReportsOverviewController error:", error);
    res.status(500).json({ success: false, message: "Failed to load reports overview." });
  }
}

export async function generateAdminReportController(req, res) {
  try {
    const { type, format = "csv", periodLabel = "Last 30 Days" } = req.body || {};
    const result = await generateAdminReport({
      type,
      format,
      periodLabel,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: result.meta, payloadText: result.payloadText });
  } catch (error) {
    console.error("generateAdminReportController error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report." });
  }
}

export async function downloadAdminReportController(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid report id." });
    const report = await getAdminReportById(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found." });

    const ext = report.format === "json" ? "json" : "csv";
    const mime = report.format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8";
    const filename = `${report.report_type}-${report.id}.${ext}`;
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(report.payload_text);
  } catch (error) {
    console.error("downloadAdminReportController error:", error);
    res.status(500).json({ success: false, message: "Failed to download report." });
  }
}
