import boto3
from boto3.dynamodb.conditions import Attr
import simplejson as json

# Inicializar el cliente de DynamoDB
dynamodb = boto3.resource('dynamodb')
sfn = boto3.client('stepfunctions')  # Añadir este cliente

table = dynamodb.Table('RippleDownRules')

def update_rule(event):
    # Obtener el RuleID desde el event
    rule_id = event['pathParameters']['RuleID']
    
    # Extraer el cuerpo del evento que contiene los campos a actualizar
    body = json.loads(event['body'])
    criterio = body.get('Criterio')
    worklet_arn = body.get('WorkletARN')
    action_token = body.get('ActionToken')

    # Verificar si Criterio o WorkletARN están presentes para la actualización
    if not criterio and not worklet_arn:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Debe enviar al menos Criterio o WorkletARN para actualizar.'}),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

    # Crear la expresión de actualización y los valores de la expresión
    update_expression = "SET "
    expression_attribute_values = {}
    expression_attribute_names = {}  # Añadido para definir los nombres de atributo

    if action_token:
        update_expression += "ActionToken = :action_token,"
        expression_attribute_values[":action_token"] = ""
    if criterio:
        update_expression += "Criterio = :criterio,"
        expression_attribute_values[":criterio"] = criterio
    if worklet_arn:
        update_expression += "WorkletARN = :worklet_arn,"
        expression_attribute_values[":worklet_arn"] = worklet_arn

        # Si se está asignando un WorkletARN, actualizar el Status a Ok
        update_expression += "#Stat = :status,"  # Usamos #Stat para escapar la palabra reservada
        expression_attribute_values[":status"] = "Ok"
        expression_attribute_names["#Stat"] = "Status"  # Definimos la correspondencia

    update_expression = update_expression.rstrip(",")

    response = table.update_item(
        Key={
            'RuleID': rule_id
        },
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ExpressionAttributeNames=expression_attribute_names,
        ReturnValues="UPDATED_NEW"
    )

    return response['Attributes']

def send_task_success_to_step_functions(task_token, updated_rule):
    #Envia el resultado a Step Functions para continuar con el flujo.
    try:
        sfn.send_task_success(
            taskToken=task_token,
            output=json.dumps({ 
                'worklet_arn': updated_rule.get("WorkletARN")
            })
        )
    except Exception as e:
        print(f"Error enviando task success a Step Functions: {e}")

def lambda_handler(event, context):
    print("EVEEEENT: ", event)
    try:
        body = json.loads(event['body'])
        action_token = body.get('ActionToken')
        # Actualizar la regla en la tabla 'RippleDownRules'
        updated_rule = update_rule(event)
        
        # Verificar si se actualizó el Status a Ok
        if updated_rule.get('Status') == 'Ok':
            # Enviar el resultado a Step Functions
            send_task_success_to_step_functions(action_token, updated_rule)

        return {
            'statusCode': 200,
            'body': json.dumps(updated_rule),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Error interno del servidor'}),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
