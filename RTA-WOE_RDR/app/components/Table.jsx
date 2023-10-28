import { useEffect, useState } from "react";
import { ArrowDownSolid, ArrowUpSolid, RotateRightSolid } from "../svg";
import { UpRightFromSquareSolid } from "../svg";
import { getOrloadOnLocalStorage } from "../helpers/getOrloadOnLocalStorage";

const Table = ({ refreshFn, data = [], columns, classNameMaxWidth = "", onRowClick, id = "default" }) => {
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);
  const [filteredData, setFilteredData] = useState(data);
  const [searchText, setSearchText] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    if (id) setLastRefresh(getOrloadOnLocalStorage(`table-${id}-lastRefresh`));
  }, []);

  useEffect(() => {
    if (!searchText) return setFilteredData(data);

    setFilteredData(
      data.filter((item) => {
        return columns.some((column) => {
          return String(item[column.property]).toLowerCase().includes(searchText.toLowerCase());
        });
      })
    );
  }, [searchText, data]);

  const onSort = (column) => {
    let direction = "asc";
    if (sortConfig && sortConfig.key === column && sortConfig.direction === "asc") {
      direction = "desc";
    }
    if (sortConfig && sortConfig.key === column && sortConfig.direction === "desc") {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key: column, direction });
  };

  useEffect(() => {
    let sortedData = [...filteredData];
    if (sortConfig) {
      sortedData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    setFilteredData(sortedData);
  }, [sortConfig]);

  return (
    <div>
      <div className="flex justify-between">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="border-2 border-gray-600 text-sm py-2 px-4 rounded-t-sm text-gray-950"
        />
        {refreshFn && (
          <div className="flex items-end gap-2">
            {lastRefresh && <span className="text-xs text-gray-400">Última actualización: {new Date(lastRefresh).toLocaleString()}</span>}
            <div
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  refreshFn();
                  if (id) setLastRefresh(getOrloadOnLocalStorage(`table-${id}-lastRefresh`, new Date().getTime()));
                  setLoading(false);
                }, 500);
              }}
              className="group flex items-center cursor-pointer w-max bg-blue-500  text-white font-bold py-2 px-4 rounded-t-sm"
            >
              <RotateRightSolid className={`${loading ? "spin-animation" : ""} group-hover:scale-125 transition duration-300`} style={{ width: 17, height: 17 }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <table className={`divide-y divide-gray-200 w-auto select-none ${classNameMaxWidth}`}>
        <thead className="bg-gray-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"></th>
            {columns.map((column) => (
              <th onClick={() => onSort(column.property)} key={column.property} className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <span>{column.label}</span>
                  {sortConfig && sortConfig.key === column.property ? (
                    sortConfig.direction === "asc" ? (
                      <ArrowUpSolid style={{ width: 15, height: 15 }} />
                    ) : (
                      <ArrowDownSolid style={{ width: 15, height: 15 }} />
                    )
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-100 divide-y divide-gray-200 text-xs text-gray-800">
          {filteredData.map((item, index) => (
            <tr key={index}>
              <td
                className="cursor-pointer px-6 py-4 whitespace-nowrap group"
                onClick={() => {
                  if (onRowClick) onRowClick(item);
                }}
              >
                <UpRightFromSquareSolid style={{ width: 15, height: 15 }} className="group-hover:scale-125 transition duration-300" />
              </td>
              {columns.map((column) => {
                if (column.property === "actions" && column.actions) {
                  return (
                    <td key={column.property} className="px-6 py-4 whitespace-nowrap">
                      {column.actions(item)?.map((action, idx) => (
                        <button key={idx} className="text-white bg-blue-500 hover:bg-blue-700" onClick={action.onClick}>
                          {action.label}
                        </button>
                      ))}
                    </td>
                  );
                }
                return (
                  <td
                    key={column.property}
                    className={`px-6 py-4 whitespace-nowrap ${column.onClick ? "cursor-pointer hover:bg-gray-300" : ""}`}
                    onClick={() => column.onClick && column.onClick(item[column.property])}
                  >
                    {item[column.property]}
                  </td>
                );
              })}
            </tr>
          ))}
          {!filteredData && (
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-center" colSpan={columns.length}>
                {loading ? "Cargando..." : "No hay datos"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
