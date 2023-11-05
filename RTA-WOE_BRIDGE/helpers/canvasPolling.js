const axios = require("axios");

const canvaslmsCourseId = "1"; //ID del Curso de Programación
const canvaslmsURL = process.env.CANVASLMS_URL;
const canvaslmsToken = process.env.CANVASLMS_TOKEN;

const estudiante1Id = 9;
const estudiante2Id = 10;
const estudiante3Id = 11;
const actividadCronometroId = 24;
const actividadHuntTheWumpusId = 29;
const actividadCalculadoraId = 26;
const actividadQuemadosId = 27;
const group1Id = 3;

const pollingPeriod = 5000;

const canvasPolling = async (tag, inputs = {}) => {
  let intervalId = null;
  let assignment = null;
  console.log("Dato TAG desde canvasPolling: ", { tag });

  return new Promise(async (resolve, reject) => {
    // Realizar el polling a la API de CanvasLMS hasta obtener el resultado deseado
    switch (tag) {
      case "desarrollar_actividad_cronometrojava": // Individual
        intervalId = setInterval(async () => {
          const submissions = await getSubmissions(intervalId, [estudiante1Id, estudiante2Id, estudiante3Id], [actividadCronometroId], (submissions) => {
            console.log("Verificando entregas individuales... (Cronometro)");
            // Verificar que todas las entregas estén enviadas
            if (submissions.every((submission) => !!submission.submitted_at)) return true;
            return false;
          });
          if (submissions && submissions.length) resolve({ ok: true, inputs: { submissions } });
        }, pollingPeriod);
        break;

      case "evaluar_actividad_cronometrojava":
        if (!inputs?.submissions?.length) reject("No se recibieron entregas desde la tarea SFN");

        intervalId = setInterval(async () => {
          const submissions = await getSubmissions(intervalId, [estudiante1Id, estudiante2Id, estudiante3Id], [actividadCronometroId], (submissions) => {
            console.log("Evaluando entregas individuales... (Cronometro)");
            // Verificar que todas las entregas estén evaluadas
            if (submissions.every((submission) => !!submission.grade)) return true;
            return false;
          });
          if (submissions && submissions.length)
            resolve({
              ok: true,
              inputs: {
                students_per_group: 3,
                students_approved: submissions.filter((submission) => submission.grade == "complete").length,
              },
            });
        }, pollingPeriod);
        break;

      case "desarrollar_actividad_huntthewumpus": // Grupal
        assignment = await publishAssignment(actividadHuntTheWumpusId);
        if (!assignment?.id) reject("No se pudo publicar la actividad 'Hunt The Wumpus'");

        intervalId = setInterval(async () => {
          const students = await getStudentsPerGroup(group1Id);
          if (!students || !students.length) return null;
          const students_ids = students.map((student) => student.id);

          const submissions = await getSubmissions(intervalId, students_ids, [actividadHuntTheWumpusId], (submissions) => {
            console.log("Verificando entrega grupal... (HuntTheWumpus)");
            // Verificar que todas las entregas estén enviadas
            if (submissions.some((submission) => submission.submitted_at)) return true;
            return false;
          });
          if (!submissions || !submissions.length) return null;

          const submissionToEvaluate = submissions.find((submission) => !!submission.submitted_at);
          if (submissionToEvaluate?.id) resolve({ ok: true, inputs: { submission: submissionToEvaluate } });
        }, pollingPeriod);
        break;

      case "asignar_notas_finales":
        if (!inputs?.submission?.id) reject("No se recibió la entrega a evaluar desde la tarea SFN");

        intervalId = setInterval(async () => {
          const submission = await getSubmissions(intervalId, [inputs.submission.user_id], [inputs.submission.assignment_id], (submissions) => {
            console.log("Evaluando entrega grupal...");
            // Verificar que la entrega esté evaluada
            if (submissions.every((submission) => !!submission.grade)) return true;
            return false;
          });
          if (submission && submission.length) resolve({ ok: true, inputs: { submission } });
        }, pollingPeriod);

        break;

      case "modificar_grupos":
        const group = await updateGroup(group1Id, [estudiante1Id, estudiante2Id]);

        if (group?.id) resolve({ ok: true, inputs: { group } });
        else reject({ ok: false, message: "No se pudo modificar el grupo" });

        break;

      case "desarrollar_actividad_calculadora": // Individual
        assignment = await publishAssignment(actividadCalculadoraId);
        if (!assignment?.id) reject("No se pudo publicar la actividad 'Calculadora'");

        intervalId = setInterval(async () => {
          const submissions = await getSubmissions(intervalId, [estudiante3Id], [actividadCalculadoraId], (submissions) => {
            console.log("Verificando entrega individual... (Calculadora)");
            // Verificar que todas las entregas estén enviadas
            if (submissions.every((submission) => !!submission.submitted_at)) return true;
            return false;
          });
          if (submissions && submissions.length) resolve({ ok: true, inputs: { submissions } });
        }, pollingPeriod);
        break;

      case "desarrollar_actividad_quemados": // Grupal
        assignment = await publishAssignment(actividadQuemadosId);
        if (!assignment?.id) reject("No se pudo publicar la actividad 'Quemados'");

        intervalId = setInterval(async () => {
          const students = await getStudentsPerGroup(group1Id);
          if (!students || !students.length) return null;
          const students_ids = students.map((student) => student.id);

          const submissions = await getSubmissions(intervalId, students_ids, [actividadQuemadosId], (submissions) => {
            console.log("Verificando entrega grupal (Quemados)");
            // Verificar que todas las entregas estén enviadas
            if (submissions.some((submission) => submission.submitted_at)) return true;
            return false;
          });
          if (!submissions || !submissions.length) return null;

          const submissionToEvaluate = submissions.find((submission) => !!submission.submitted_at);
          if (submissionToEvaluate?.id) resolve({ ok: true, inputs: { submission: submissionToEvaluate } });
        }, pollingPeriod);

      default:
        //reject({ ok: false, message: "No se encontró el tag" });
        break;
    }
  });
};

// Modificar un grupo en CanvasLMS
const updateGroup = async (group_id, student_ids = []) => {
  try {
    if (!group_id) throw new Error("Se requiere un group_id para modificar el grupo");
    if (!student_ids.length) throw new Error("Se requiere al menos un student_id");

    const response = await axios.put(
      `${canvaslmsURL}/api/v1/groups/${group_id}`,
      {
        members: student_ids,
      },
      {
        headers: {
          Authorization: `Bearer ${canvaslmsToken}`,
        },
      }
    );

    let group = response.data;
    if (!group?.id) return null;

    return group;
  } catch (error) {
    console.error("Error al intentar modificar el grupo: ", error);
    return null;
  }
};

// Publicar una actividad en CanvasLMS
const publishAssignment = async (assignment_id, intervalId = null) => {
  try {
    if (!assignment_id) throw new Error("Se requiere un assignment_id para publicar la actividad");

    const response = await axios.put(
      `${canvaslmsURL}/api/v1/courses/${canvaslmsCourseId}/assignments/${assignment_id}`,
      {
        assignment: {
          published: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${canvaslmsToken}`,
        },
      }
    );

    let assignment = response.data;
    if (!assignment) return null;

    return assignment;
  } catch (error) {
    if (intervalId) stopPolling(intervalId);
    console.error("Error al intentar publicar la actividad: ", error);
    return null;
  }
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
