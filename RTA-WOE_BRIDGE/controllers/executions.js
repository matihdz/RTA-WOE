const { stepfunctions } = require("../config/awsConfig");
const { canvasPolling } = require("../helpers/canvasPolling");

const createExecution = async (req, res) => {
  const event = req.body;
  const { tag, token } = event;

  let canvasResult = null;
  console.log("Datos recibidos desde Tarea SFN (lambda): ", {
    tag,
    //token,
    event,
  });
  // Responder inmediatamente a la Lambda
  res.status(200).json({
    message: "Polling iniciado",
  });

  // Realizar el polling a la API de CanvasLMS
  try {
    const { ok, message = "", inputs = {} } = await canvasPolling(tag, event.inputs);
    if (!ok) throw new Error(message);
    canvasResult = { ...inputs };
    console.log("Resultado API canvas encontrado");
  } catch (error) {
    console.error("Error al realizar el polling:", error);

    stepfunctions
      .sendTaskFailure({
        cause: `${error}`,
        error: "PollingError",
        taskToken: token,
      })
      .promise()
      .then(() => {
        console.log("Fallo enviado a Step Functions");
      })
      .catch((failureError) => {
        console.error("Error al llamar a Step Functions para enviar el error", failureError);
      });

    return;
  }

  // Enviar el resultado a Step Functions
  try {
    // Agregar el resultado del polling al evento
    event.inputs = { ...event.inputs, ...canvasResult };

    await stepfunctions
      .sendTaskSuccess({
        output: JSON.stringify({ ...event }),
        taskToken: token,
      })
      .promise();
  } catch (error) {
    console.error("Error al llamar a Step Functions:", error);

    stepfunctions
      .sendTaskFailure({
        cause: `${error}`,
        error: "Error al llamar a Step Functions para enviar el resultado",
        taskToken: token,
      })
      .promise()
      .then(() => {
        console.log("Fallo enviado a Step Functions");
      })
      .catch((failureError) => {
        console.error("Error al llamar a Step Functions para enviar el error", failureError);
      });
    return;
  }
};

module.exports = {
  createExecution,
};
