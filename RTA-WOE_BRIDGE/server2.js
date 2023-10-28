const express = require("express");
const cors = require("cors");
const axios = require("axios");

const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const stepfunctions = new AWS.StepFunctions();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.canvaslmsCourseId = "1"; //ID del Curso de Programación
    this.canvaslmsURL = process.env.CANVASLMS_URL;
    this.canvaslmsToken = process.env.CANVASLMS_TOKEN;
    this.pollingInterval = 5000;
    this.intervalId = null;
    this.stateMachineArn = process.env.AWS_STATE_MACHINE_ARN;
    this.pollingSteps = [
      "crear_actividad",
      "cerrar_actividad"
    ];
    this.inputStateMachine = {
      inputs: {
        students_per_group: 6,
        class_level: "doctorado",
        user_id: "12345",
      },
      case_id: "2",
      example: "example",
    };

    //Middlewares
    this.middlewares();

    //Routes
    this.routes();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static("public"));
  }

  routes() {}

  listen() {
    this.app.listen(this.port, () => {
      console.log("Escuchando en el puerto ", this.port);
      // iniciar el workflow en AWS Step Functions
      this.startStepFunctionExecution();

      this.intervalId = setInterval(() => {
        this.getCanvasAssignments();
      }, this.pollingInterval);
    });
  }

  async getCanvasAssignments() {
    try {
      console.log("Polling Actividades...");
      const response = await axios.get(`${this.canvaslmsURL}/api/v1/courses/${this.canvaslmsCourseId}/assignments`, {
        headers: {
          Authorization: `Bearer ${this.canvaslmsToken}`,
        },
      });
      const assignments = response.data;

      if (assignments && assignments.length && this.intervalId) {
        this.stopPolling();
        console.log("Actividades encontradas, deteniendo polling...");
      }

      
    } catch (error) {
      this.stopPolling();
      console.error("Error al intentar obtener actividades:", error);
    }
  }

  async startStepFunctionExecution() {
    const params = {
      stateMachineArn: this.stateMachineArn,
      input: JSON.stringify(this.inputStateMachine),
    };

    try {
      const data = await stepfunctions.startExecution(params).promise();
      console.log("Step Function iniciada:", data);
      return data;
    } catch (error) {
      console.error("Error al iniciar Step Function:", error);
      throw error;
    }
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

module.exports = Server;
