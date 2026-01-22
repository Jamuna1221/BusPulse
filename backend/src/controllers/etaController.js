import calculateETA from "../services/etaService.js";

export const getETA = (req, res) => {
  try {
    const { routeId, currentStopId, requestTime } = req.body;

    if (!routeId || !currentStopId || !requestTime) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const etaResult = calculateETA({
      routeId,
      currentStopId,
      requestTime,
    });

    return res.status(200).json(etaResult);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
