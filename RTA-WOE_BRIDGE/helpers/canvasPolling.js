const axios = require("axios");

const canvaslmsCourseId = "1"; //ID del Curso de Programación
const canvaslmsURL = process.env.CANVASLMS_URL;
const canvaslmsToken = process.env.CANVASLMS_TOKEN;

const canvasPolling = async (tag) => {
  // Realizar el polling a la API de CanvasLMS hasta obtener el resultado deseado
  switch (tag) {
    case "crear_actividad":
      let intervalId = setInterval(() => {
        let assignments = getCanvasAssignments(intervalId);
        if (assignments) return assignments;
      }, 3000);
      break;

    case "cerrar_actividad":
      break;

    default:
      break;
  }

  return null;
};

const getCanvasAssignments = async (intervalId) => {
  try {
    console.log("Polling Actividades...");
    const response = await axios.get(`${canvaslmsURL}/api/v1/courses/${canvaslmsCourseId}/assignments`, {
      headers: {
        Authorization: `Bearer ${canvaslmsToken}`,
      },
    });
    const assignments = response.data;

    if (assignments && assignments.length && intervalId) {
      stopPolling(intervalId);
      console.log("Actividades encontradas, deteniendo polling...");
      return assignments;
    }

    return null;
  } catch (error) {
    stopPolling(intervalId);
    console.error("Error al intentar obtener actividades:", error);
  }
};

const stopPolling = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  canvasPolling,
};
