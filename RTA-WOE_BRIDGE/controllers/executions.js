const { stepfunctions } = require("../config/awsConfig");
const { canvasPolling } = require("../helpers/canvasPolling");

const createExecution = async (req, res) => {
  const { tag, token, event } = req.body;
  let canvasResult = null;
  console.log("Datos recibidos desde Tarea SFN (lambda): ", event);
  // Responder inmediatamente a la Lambda
  res.status(200).json({
    message: "Polling iniciado",
  });

  // Realizar el polling a la API de CanvasLMS
  try {
    canvasResult = await canvasPolling(tag);
    if (!canvasResult) throw new Error("No se encontró el resultado");
    console.log("Resultado encontrado: ", canvasResult);
  } catch (error) {
    console.error("Error al realizar el polling:", error);
  }

  // Enviar el resultado a Step Functions
  try {
    await stepfunctions
      .sendTaskSuccess({
        output: JSON.stringify({ ...event, canvasResult }),
        taskToken: token,
      })
      .promise();
  } catch (error) {
    console.error("Error al llamar a Step Functions:", error);
  }
};

module.exports = {
  createExecution,
};
