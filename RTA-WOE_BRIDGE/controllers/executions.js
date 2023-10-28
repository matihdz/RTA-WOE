module.exports = (stepfunctions) => {
  const createExecution = async (req, res) => {
    const { tag, token } = req.body;

    // Realizar el polling a la API de CanvasLMS
    const canvasResult = await canvasPolling(tag);
    if (!canvasResult) {
      res.status(400).json({
        message: "Resultado no encontrado",
      });
      return;
    }

    try {
      await stepfunctions
        .sendTaskSuccess({
          output: JSON.stringify(canvasResult),
          token: token,
        })
        .promise();

      res.status(200).json({
        message: "Ok",
      });
    } catch (error) {
      console.error("Error al llamar a Step Functions:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  return {
    createExecution,
  };
};
