export const getOrloadOnLocalStorage = (key, value) => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(key);

    // Queremos guardar un valor en localStorage
    if (value && value !== "undefined" && value !== "") {
      localStorage.setItem(key, JSON.stringify(value) || "");
      return value;
    }

    // Queremos obtener un valor de localStorage
    if (data && data !== "undefined" && data !== "") {
      return JSON.parse(data);
    } else {
      localStorage.setItem(key, JSON.stringify(value) || "");
      return value;
    }
  }
};
