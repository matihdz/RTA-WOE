const axios = require("axios");

const canvaslmsCourseId = "1"; //ID del Curso de Programación
const canvaslmsURL = process.env.CANVASLMS_URL;
const canvaslmsToken = process.env.CANVASLMS_TOKEN;

const canvasPolling = async (tag, externalEvent = {}) => {
  let intervalId = null;

  return new Promise((resolve, reject) => {
    // Realizar el polling a la API de CanvasLMS hasta obtener el resultado deseado
    switch (tag) {
      case "crear_actividad":
        intervalId = setInterval(async () => {
          const assignment = await getCanvasLastPublishedAssignment(intervalId);
          if (assignment?.id) resolve({ ok: true, externalEvent: { assignment } });
        }, 3000);
        break;

      case "cerrar_actividad":
        if (!externalEvent?.assignment?.id) reject("No se encontró el id de la actividad");

        intervalId = setInterval(async () => {
          const assignment = await getCanvasUnpublishedAssignment(intervalId, externalEvent.assignment.id);
          if (assignment?.id) resolve({ ok: true, externalEvent: { assignment } });
        }, 3000);
        break;

      default:
        reject({ ok: false, message: "No se encontró el tag" });
        break;
    }
  });
};

// Obtener la última actividad publicada en CanvasLMS
const getCanvasLastPublishedAssignment = async (intervalId) => {
  try {
    if (!intervalId) throw new Error("Se requiere un intervalId para realizar el polling");

    console.log("Polling actividades publicadas...");
    const response = await axios.get(`${canvaslmsURL}/api/v1/courses/${canvaslmsCourseId}/assignments`, {
      headers: {
        Authorization: `Bearer ${canvaslmsToken}`,
      },
    });
    let assignments = response.data;
    if (!assignments || !assignments.length) return null;

    assignments = assignments.filter((assignment) => assignment.workflow_state == "published");
    if (!assignments || !assignments.length) return null;

    // Obtener la última actividad publicada segun el created_at
    let lastAssignment = assignments[0];
    if (assignments.length > 1) {
      lastAssignment = assignments.find((assignment) => assignment.created_at > lastAssignment.created_at) || lastAssignment;
    }

    stopPolling(intervalId);
    console.log("Actividad encontrada ID: ", lastAssignment?.id);
    return lastAssignment;
  } catch (error) {
    stopPolling(intervalId);
    console.error("Error al intentar obtener actividades publicadas:", error);
    return null;
  }
};

// Verificar que la actividad se haya cerrado en CanvasLMS
const getCanvasUnpublishedAssignment = async (intervalId, assignmentId) => {
  try {
    if (!intervalId) throw new Error("Se requiere un intervalId para realizar el polling");

    console.log("Polling actividad cerrada...");
    const response = await axios.get(`${canvaslmsURL}/api/v1/courses/${canvaslmsCourseId}/assignments/${assignmentId}`, {
      headers: {
        Authorization: `Bearer ${canvaslmsToken}`,
      },
    });
    let assignment = response.data;
    if (!assignment || !assignment.id || assignment?.workflow_state != "unpublished") return null;

    stopPolling(intervalId);
    console.log("Actividad cerrada encontrada ID: ", assignmentId);
    return assignment;
  } catch (error) {
    stopPolling(intervalId);
    console.error("Error al intentar obtener actividad cerrada:", error);
    return null;
  }
};

const stopPolling = (intervalId) => {
  if (intervalId) clearInterval(intervalId);
};

module.exports = {
  canvasPolling,
};
