const operators = ["==", "<=", ">", "<", "AND", "OR"];
const variables = ["class_level", "students_per_group"];

const OperatorSelector = ({ value, onChange, disabled = false }) => (
  <div className="flex justify-between items-center">
    <label className="text-sm font-medium text-gray-700 mr-2">Operator:</label>
    <select value={value} onChange={onChange} className="border p-2 rounded-md" disabled={disabled}>
      {operators.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  </div>
);

const Condition = ({ condition, index, onNestedChange, onRemove, disabled = false }) => (
  <div className="relative flex space-x-4">
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">Variable:</label>
      <select disabled={disabled} value={condition.variable} onChange={(e) => onNestedChange(index, { ...condition, variable: e.target.value })} className="border p-2 rounded-md">
        {variables.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
    <OperatorSelector value={condition.operator} onChange={(e) => onNestedChange(index, { ...condition, operator: e.target.value })} disabled={disabled} />
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">Value:</label>
      <input disabled={disabled} value={condition.value} onChange={(e) => onNestedChange(index, { ...condition, value: e.target.value })} className="border p-2 rounded-md" />
    </div>
    <button
      onClick={() => onRemove(index)}
      className="absolute top-0 right-0 mt-2 mr-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      disabled={disabled}
    >
      Remove
    </button>
  </div>
);

const CriteriaInput = ({ value = {}, onChange, disabled = false }) => {
  const handleNestedConditionsChange = (index, newValue) => {
    const newConditions = [...(value.conditions || [])];
    newConditions[index] = newValue;
    onChange({ ...value, conditions: newConditions });
  };

  const handleOperatorChange = (e) => {
    const selectedOperator = e.target.value;

    if (["AND", "OR"].includes(selectedOperator)) {
      onChange({ operator: selectedOperator });
    } else {
      if (value.conditions) {
        // Si cambiamos a un operador simple desde "AND"/"OR", tomamos la primera condición existente si existe.
        onChange(value.conditions[0] || { operator: selectedOperator });
      } else {
        onChange({ ...value, operator: selectedOperator });
      }
    }
  };

  const addCondition = () => {
    if (value.conditions) {
      // Caso 3: Si ya hay condiciones existentes, agregamos una nueva a esa lista.
      onChange({ ...value, conditions: [...value.conditions, { operator: "==" }] });
    } else if (["AND", "OR"].includes(value.operator)) {
      // Caso 2: Si ya tenemos un operador "AND" u "OR" pero no hay condiciones, añadimos una nueva condición anidada.
      onChange({ ...value, conditions: [{ operator: "==" }] });
    } else {
      // Caso 1: Estamos en la raíz y no hay operador "AND" u "OR" establecido, inicializamos una condición simple.
      onChange({ operator: "==", variable: variables[0], value: "" });
    }
  };

  const handleRemoveCondition = (indexToRemove) => {
    const newConditions = value.conditions.filter((_, index) => index !== indexToRemove);
    onChange({ ...value, conditions: newConditions });
  };

  // Si no hay condiciones y el valor es un objeto vacío, muestra solo el botón "Add Condition".
  if (!value.conditions && (!value.operator || !value.variable || value.value === undefined)) {
    return (
      <div className="border p-4 rounded-md bg-white shadow-sm">
        <button
          onClick={addCondition}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          disabled={disabled}
        >
          Add Condition
        </button>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-md space-y-4 bg-white shadow-sm">
      <OperatorSelector value={value.operator} onChange={handleOperatorChange} disabled={disabled} />

      {
        // Si no es "AND" u "OR", muestra la condición simple.
        !["AND", "OR"].includes(value.operator) && !value.conditions && <Condition condition={value} index={-1} onNestedChange={(index, newValue) => onChange(newValue)} disabled={disabled} />
      }

      {
        // Si es "AND" u "OR", mapea las condiciones anidadas.
        (value.conditions || []).map((condition, index) => {
          if (!["AND", "OR"].includes(condition.operator)) {
            return <Condition key={index} condition={condition} index={index} onNestedChange={handleNestedConditionsChange} onRemove={handleRemoveCondition} disabled={disabled} />;
          }
          return <CriteriaInput disabled={disabled} key={index} value={condition} onChange={(newValue) => handleNestedConditionsChange(index, newValue)} />;
        })
      }

      {
        // Si el operador es "AND" u "OR", muestra el botón "Add Condition".
        ["AND", "OR"].includes(value.operator) && (
          <button
            onClick={addCondition}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={disabled}
          >
            Add Condition
          </button>
        )
      }
    </div>
  );
};

export default CriteriaInput;
