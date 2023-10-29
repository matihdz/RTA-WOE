const axios = require("axios");

const canvaslmsCourseId = "1"; //ID del Curso de Programación
const canvaslmsURL = process.env.CANVASLMS_URL;
const canvaslmsToken = process.env.CANVASLMS_TOKEN;

const canvasPolling = async (tag) => {
  return new Promise((resolve, reject) => {
    // Realizar el polling a la API de CanvasLMS hasta obtener el resultado deseado
    switch (tag) {
      case "crear_actividad":
        let intervalId = setInterval(async () => {
          let assignments = await getCanvasAssignments(intervalId);
          if (assignments) resolve(assignments);
        }, 3000);
        break;

      case "cerrar_actividad":
        // Aquí puedes manejar la lógica para cerrar actividad
        break;

      default:
        reject("El tag no es válido");
        break;
    }
    reject("No se encontró el resultado");
  });
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
  if (intervalId) clearInterval(intervalId);
};

module.exports = {
  canvasPolling,
};
