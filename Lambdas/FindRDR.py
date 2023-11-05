import simplejson as json
import boto3
from boto3.dynamodb.conditions import Attr
from decimal import Decimal
import uuid

# Inicializa los servicios de AWS
dynamodb = boto3.resource('dynamodb')
# tabla DynamoDB
tableRDR = dynamodb.Table('RippleDownRules')

# Funcion para generar un ID único
def generate_unique_id():
    return str(uuid.uuid4())

# Funcion para evaluar la condición con el operador
def evaluate_condition(input_value, rule_operator, rule_value):
    # Función para manejar comparaciones de strings
    def compare_strings(input_val, operator, rule_val):
        if operator == "==":
            return input_val == rule_val
        else:
            raise ValueError(f"Operator {operator} is not valid for string comparisons")

    # Función para manejar comparaciones numéricas
    def compare_numbers(input_val, operator, rule_val):
        comparison_operators = {
            "==": lambda a, b: a == b,
            ">": lambda a, b: a > b,
            "<": lambda a, b: a < b,
            ">=": lambda a, b: a >= b,
            "<=": lambda a, b: a <= b,
        }

        if operator in comparison_operators:
            return comparison_operators[operator](input_val, rule_val)
        else:
            raise ValueError(f"Operator {operator} is not valid for number comparisons")

    # Verificar el tipo de rule_value y llamar a la función de comparación correspondiente
    if isinstance(rule_value, str):
        if not isinstance(input_value, str):
            raise TypeError('Expected a string for comparison with a string rule value')
        return compare_strings(input_value, rule_operator, rule_value)

    elif isinstance(rule_value, (int, float, Decimal)):
        if not isinstance(input_value, (int, float, Decimal)):
            raise TypeError('Expected a number for comparison with a numeric rule value')
        return compare_numbers(float(input_value), rule_operator, float(rule_value))

    else:
        raise TypeError(f'Unsupported variable type for rule value: {type(rule_value)}')

# Función para evaluar el criterio de un nodo
def evaluate_criterio(node, inputs):
    criterio = node.get('Criterio', {})
    parent_rule_id = node.get('ParentRuleID', None)

    if not criterio and not parent_rule_id:
        return True  # Nodo raíz

    return evaluate_condition_tree(criterio, inputs)

# Función para evaluar un árbol de condiciones
def evaluate_condition_tree(condition, inputs):
    if "operator" in condition and condition["operator"] in ["AND", "OR"]:
        results = [evaluate_condition_tree(sub_condition, inputs) for sub_condition in condition["conditions"]]

        if condition["operator"] == "AND":
            return all(results)
        elif condition["operator"] == "OR":
            return any(results)
    else:
        input_value = inputs.get(condition["variable"], None) 
        if input_value is None:
            raise Exception(f'Variable {condition["variable"]} not found in inputs')
        return evaluate_condition(input_value, condition["operator"], condition["value"])

# Función para encontrar el id del nodo raíz
def find_root_node(case_id, example):
    items = tableRDR.scan(FilterExpression=Attr('CaseID').eq(case_id) & Attr('ParentRuleID').eq(None) & Attr('Example').eq(example))['Items'] 
    if items:
        return items[0]
    return None

# Función para encontrar el nodo siguiente según la posición (Right o Left)
def find_next_node(current_node_id, position, case_id, example):
    response = tableRDR.scan(
        FilterExpression= Attr('ParentRuleID').eq(current_node_id) &
                          Attr('NodePosition').eq(position) &
                          Attr('CaseID').eq(case_id) &
                          Attr('Example').eq(example)
    )
    items = response.get('Items', None)
    return items[0]['RuleID'] if items else None

# Función para agregar una nueva regla a la tabla DynamoDB
def add_new_rule(case_id, example, parent_rule_id, node_position):
    new_rule_id = generate_unique_id() 
    tableRDR.put_item(
        Item={
            'RuleID': new_rule_id,
            'CaseID': case_id,
            'ParentRuleID': parent_rule_id,
            'NodePosition': node_position,
            'Criterio': None, # TODO: Es None hasta que se implemente la funcionalidad para determinar un nuevo criterio
            'WorkletARN': None, # TODO: Es None hasta que se implemente la funcionalidad para determinar un nuevo worklet
            'Status': "Pending",
            'Example': example, #Este campo es para diferenciar entre los ejemplos, eliminar cuando se implemente
            'ActionToken': ""
        }
    )
    return new_rule_id

# Función para navegar a través del árbol
def navigate_tree(current_node_id, inputs, last_correct_node_worklet_arn):
    response = tableRDR.get_item(Key={'RuleID': current_node_id})
    current_node = response.get('Item', {})
    current_node_case_id = current_node.get('CaseID', None)
    current_node_example = current_node.get('Example', None)
    current_node_worklet_arn = current_node.get('WorkletARN', None)
    
    if evaluate_criterio(current_node, inputs):
        next_node_id = find_next_node(current_node_id, 'Right', current_node_case_id, current_node_example)
        if next_node_id:
            return navigate_tree(next_node_id, inputs, current_node_worklet_arn)
        else:
            #retornar id del nodo y worklet
            return [current_node_id, current_node_worklet_arn, None]
    else:
        next_node_id = find_next_node(current_node_id, 'Left', current_node_case_id, current_node_example)
        if next_node_id:
            return navigate_tree(next_node_id, inputs, last_correct_node_worklet_arn)
        else:
            # Agregar nueva regla
            new_rule_id = add_new_rule(current_node_case_id, current_node_example, current_node_id, 'Left')

            # TODO: Se utiliza el último worklet correcto encontrado, pero se puede utilizar el nuevo worklet si la funcionalidad para determinar un nuevo worklet ya está implementada
            return [current_node_id, last_correct_node_worklet_arn, new_rule_id]

# Lambda principal
def lambda_handler(event, context):
    try:
        inputs = event.get("inputs", None)
        case_id = event.get("case_id", None)
        example = event.get("example", None)
        user_id = inputs.get("user_id", None)
        print("1: ", example) 
        # Valida que los parámetros requeridos estén presentes
        if not inputs or not case_id or not example:
            raise Exception('Missing required parameters')

        # Encuentra el nodo raíz
        root_node = find_root_node(case_id, example)
        print("root_node: ", root_node) 
        root_node_id = root_node.get('RuleID', None)
        root_node_worklet_arn = root_node.get('WorkletARN', None)
        if not root_node_id or not root_node_worklet_arn:
            raise Exception('Root node not found')
        
        # Navega a través del árbol
        # retornar id del nodo y worklet
        [node_id, worklet_arn, new_rule_id] = navigate_tree(root_node_id, inputs, root_node_worklet_arn)
        if new_rule_id:
            return {
                'case_id': case_id,
                'statusCode': 200,
                'Worklet': {
                    'worklet_arn': ""
                },
                'new_rule_id': new_rule_id,
                'example': example,
                'inputs': inputs
            }
        
        # Si no se encontró un worklet_arn, se lanza una excepción
        if not worklet_arn:
            raise Exception('No matching rule found')
        
        return {
            'case_id': case_id,
            'statusCode': 200,
            'Worklet': {
                'worklet_arn': worklet_arn
            },
            'new_rule_id': "",
            'example': example,
            'inputs': inputs
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f'An error occurred: {str(e)}')
        }
