import { useState } from "react";
import Spinner from "../components/Spinner";
import CriteriaInput from "../components/CriteriaInput";
import { useModal } from "../context/ModalContext";

const workletOptions = [
  {
    ID: "arn:aws:states:us-east-1:344997692965:stateMachine:AV-Presentacion",
    label: "Presentacion",
  },
  {
    ID: "arn:aws:states:us-east-1:344997692965:stateMachine:AV-Ensayo",
    label: "Ensayo",
  },
];

const RuleForm = ({ rule, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(rule);
  const { setModalConfig } = useModal();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de campos Criterio y WorkletARN
    if (!formData.Criterio && !formData.WorkletARN) {
      alert("Criterio y WorkletARN no pueden estar vacíos.");
      return;
    } else if (!formData.Criterio) {
      alert("Criterio no puede estar vacío.");
      return;
    } else if (!formData.WorkletARN) {
      alert("WorkletARN no puede estar vacío.");
      return;
    }

    // Validación de que otros campos no hayan sido cambiados
    const unchangedFields = ["RuleID", "CaseID", "NodePosition", "ParentRuleID", "Status"];
    for (let field of unchangedFields) {
      if (rule[field] !== formData[field]) {
        alert(`El campo ${field} no puede ser modificado.`);
        return;
      }
    }

    setLoading(true);

    console.log(formData);
    try {
      const response = await fetch(`https://6bvtk82sog.execute-api.us-east-1.amazonaws.com/rules/${rule.RuleID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setModalConfig({
          isOpen: false,
          componentName: null,
          componentProps: null,
        });
      } else {
        alert("Error al enviar datos. " + (data.message || ""));
      }
    } catch (error) {
      console.error("Error en el fetch:", error);
      alert("Error al enviar datos.");
    }

    setLoading(false);
  };

  const handleCriteriaChange = (newCriteria) => {
    setFormData((prevData) => ({
      ...prevData,
      Criterio: newCriteria,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Rule ID</label>
        <input type="text" name="RuleID" value={formData?.RuleID || ""} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Case ID</label>
        <input type="text" name="CaseID" value={formData?.CaseID || ""} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Node Position</label>
        <input type="text" name="NodePosition" value={formData?.NodePosition || ""} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Parent Rule ID</label>
        <input type="text" name="ParentRuleID" value={formData?.ParentRuleID || ""} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <input type="text" name="Status" value={formData?.Status || ""} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md" disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Criterio</label>
        <CriteriaInput value={formData?.Criterio || {}} onChange={handleCriteriaChange} disabled={disabled} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Worklet</label>
        <select name="WorkletARN" value={formData?.WorkletARN || ""} onChange={handleInputChange} disabled={disabled} className="mt-1 block w-full shadow-sm sm:text-sm rounded-md">
          <option value="" disabled>
            Select a worklet
          </option>
          {workletOptions.map((option) => (
            <option key={option.ID} value={option.ID}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button disabled={disabled} type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md w-min">
        {loading ? <Spinner width={20} height={20} /> : "Submit"}
      </button>
    </form>
  );
};

const WorkletsEdition = ({ data, props = { disabled: false } }) => {
  return data ? <RuleForm rule={data} disabled={props.disabled} /> : <div>Rule not found</div>;
};

export default WorkletsEdition;
