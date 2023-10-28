"use client";
import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { useModal } from "../context/ModalContext";
import { getOrloadOnLocalStorage } from "../helpers/getOrloadOnLocalStorage";

const page = () => {
  const [RDRs, setRDRs] = useState([]);
  const { setModalConfig } = useModal();

  useEffect(() => {
    getOrloadOnLocalStorage("activityToken") || null;
    setRDRs(getOrloadOnLocalStorage("RDRs") || []);
  }, []);

  const getRDRsData = async () => {
    const query = await fetch(`https://6bvtk82sog.execute-api.us-east-1.amazonaws.com/rules/example/presentacion_ensayo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await query.json();

    if (Array.isArray(data)) {
      setRDRs(data);
      getOrloadOnLocalStorage("RDRs", data);
    }

    return data;
  };

  const getActivityTokenData = async () => {
    const query = await fetch("https://h4f6p1mxu7.execute-api.us-east-1.amazonaws.com/activities/token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await query.json();

    if (data && typeof data === "string") {
      getOrloadOnLocalStorage("activityToken", data);
    }

    return data;
  };

  return (
    <div className="p-4 flex flex-col justify-center items-center">
      <Table
        id="RDRs"
        data={RDRs}
        refreshFn={getRDRsData}
        onRowClick={(data) => {
          setModalConfig({ isOpen: true, componentName: "WorkletsEdition", componentProps: { RuleID: data.RuleID, disabled: true } });
        }}
        columns={[
          {
            property: "RuleID",
            label: "ID",
          },
          {
            property: "Example",
            label: "Ejemplo",
          },
          {
            property: "NodePosition",
            label: "Posición en el Árbol",
          },
          {
            property: "ParentRuleID",
            label: "ID Padre",
          },
          {
            property: "Status",
            label: "Estado",
          },
          {
            property: "actions",
            label: "Acciones",
            actions: (data) => {
              let actions = [];
              if (data.Status == "Pending") {
                actions.push({
                  label: "Asociar Worklet",
                  onClick: async () => {
                    let token = await getActivityTokenData();
                    if (!token) return alert("No se pudo obtener un Activity Token.");

                    setModalConfig({ isOpen: true, componentName: "WorkletsEdition", componentProps: { RuleID: data.RuleID, activityToken: token } });
                  },
                });
              }
              return actions;
            },
          },
        ]}
      />
    </div>
  );
};

export default page;
