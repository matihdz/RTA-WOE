const express = require("express");
const cors = require("cors");

const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const stepfunctions = new AWS.StepFunctions();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.stateMachineArn = process.env.AWS_STATE_MACHINE_ARN;
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

  routes() {
    this.app.use(
      "/api/executions",
      require(`./routes/executions`)({
        stepfunctions,
        dynamoDB,
      })
    );
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log("Escuchando en el puerto ", this.port);
      this.startStepFunctionExecution();
    });
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
}

module.exports = Server;
