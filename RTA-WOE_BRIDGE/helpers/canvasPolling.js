const axios = require("axios");

const canvaslmsCourseId = "1"; //ID del Curso de Programación
const canvaslmsURL = process.env.CANVASLMS_URL;
const canvaslmsToken = process.env.CANVASLMS_TOKEN;

const canvasPolling = async (tag, externalEvent = {}) => {
  let intervalId = null;

  return new Promise((resolve, reject) => {
    // Realizar el polling a la API de CanvasLMS hasta obtener el resultado deseado
    switch (tag) {
      case "desarrollar_actividad_cronometrojava":
        intervalId = setInterval(async () => {
          const submissions = await getSubmissions(intervalId, [9, 10, 11], [23], (submissions) => {
            console.log("Verificando entregas...");
            // Verificar que todas las entregas estén enviadas
            if (submissions.every((submission) => !!submission.submitted_at)) return true;
            return false;
          });
          if (submissions && submissions.length) resolve({ ok: true, externalEvent: { submissions } });
        }, 3000);
        break;

      case "evaluar_actividad_cronometrojava":
        if (!externalEvent?.submissions?.length) reject("No se recibieron entregas desde la tarea SFN");

        intervalId = setInterval(async () => {
          const submissions = await getSubmissions(intervalId, [9, 10, 11], [23], (submissions) => {
            console.log("Evaluando entregas...");
            // Verificar que todas las entregas estén evaluadas
            if (submissions.every((submission) => !!submission.grade)) return true;
            return false;
          });
          if (submissions && submissions.length) resolve({ ok: true, externalEvent: { submissions } });
        }, 3000);
        break;

      case "desarrollar_actividad_huntthewumpus":
        if (!externalEvent?.submissions?.length) reject("No se recibieron entregas desde la tarea SFN");

        intervalId = setInterval(async () => {
          const students = await getStudentsPerGroup(3);
          if (!students || !students.length) return null;
          const students_ids = students.map((student) => student.id);

          const submissions = await getSubmissions(intervalId, students_ids, [22], (submissions) => {
            console.log("Verificando entrega grupal...");
            // Verificar que todas las entregas estén enviadas
            if (submissions.some((submission) => submission.submitted_at)) return true;
            return false;
          });
          const submissionToEvaluate = submissions.find((submission) => !!submission.submitted_at);
          if (submissionToEvaluate?.id) resolve({ ok: true, externalEvent: { submission: submissionToEvaluate } });
        }, 3000);
        break;

      case "asignar_notas_finales":
        if (!externalEvent?.submission?.id) reject("No se recibió la entrega a evaluar desde la tarea SFN");
        const {
          submission: { user_id, assignment_id },
        } = externalEvent;

        intervalId = setInterval(async () => {
          const submission = await getSubmissions(intervalId, [user_id], [assignment_id], (submissions) => {
            console.log("Evaluando entrega grupal...");
            // Verificar que la entrega esté evaluada
            if (submissions.every((submission) => !!submission.grade)) return true;
            return false;
          });
          if (submission && submission.length) resolve({ ok: true, externalEvent: { submission } });
        }, 3000);

        break;

      default:
        reject({ ok: false, message: "No se encontró el tag" });
        break;
    }
  });
};

// Obtener la última actividad publicada en CanvasLMS
const getSubmissions = async (intervalId, student_ids = [], assignment_ids = [], verifyFn) => {
  try {
    if (!intervalId) throw new Error("Se requiere un intervalId para realizar el polling");
    if (!student_ids.length) throw new Error("Se requiere al menos un student_id");
    if (!assignment_ids.length) throw new Error("Se requiere al menos un assignment_id");

    const response = await axios.get(`${canvaslmsURL}/api/v1/courses/${canvaslmsCourseId}/students/submissions`, {
      headers: {
        Authorization: `Bearer ${canvaslmsToken}`,
      },
      params: {
        student_ids: student_ids,
        assignment_ids: assignment_ids,
      },
    });
    let submissions = response.data;
    if (!submissions || !submissions.length) return null;

    if (verifyFn && !verifyFn(submissions)) return null;

    stopPolling(intervalId);
    return submissions;
  } catch (error) {
    stopPolling(intervalId);
    console.error("Error al intentar obtener entregas: ", error);
    return null;
  }
};

// Obtener los estudiantes de un grupo
const getStudentsPerGroup = async (group_id) => {
  try {
    if (!group_id) throw new Error("Se requiere un group_id para obtener los estudiantes");

    const response = await axios.get(`${canvaslmsURL}/api/v1/groups/${group_id}/users`, {
      headers: {
        Authorization: `Bearer ${canvaslmsToken}`,
      },
    });

    let students = response.data;
    if (!students || !students.length) return null;

    return students;
  } catch (error) {
    console.error("Error al intentar obtener estudiantes: ", error);
    return null;
  }
};

const stopPolling = (intervalId) => {
  if (intervalId) clearInterval(intervalId);
};

module.exports = {
  canvasPolling,
};
