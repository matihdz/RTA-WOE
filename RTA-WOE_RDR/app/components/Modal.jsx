import { useModal } from "../context/ModalContext";
import WorkletsEdition from "../worklets/WorkletsEdition";

const Modal = ({ componentName, componentProps }) => {
  const { setModalConfig } = useModal();

  const components = {
    WorkletsEdition: <WorkletsEdition {...componentProps} />,
  };

  const ComponentToRender = components[componentName];

  return (
    <div className="px-4 fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 text-gray-800 text-xs">{ComponentToRender}</div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={() => setModalConfig({ isOpen: false })}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
