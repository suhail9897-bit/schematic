import React, { useRef, useState } from "react";
import ComponentPanel from "./component/componentpanel";
import ClearConfirmModal from "./extraFiles/confirm";
import Canvas from "./component/Canvas";


const App = () => {
  const canvasApi = useRef(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Component add handlers → Canvas ref API
  const handleResistorClick = () => canvasApi.current?.drawResistor();
  const handleCapacitorClick = () => canvasApi.current?.drawCapacitor();
  const handleInductorClick = () => canvasApi.current?.drawInductor();
  const handleDiodeClick = () => canvasApi.current?.drawDiode();

  const handleNPNClick = () => canvasApi.current?.drawNPN();
  const handlePNPClick = () => canvasApi.current?.drawPNP();
  const handleNMOSClick = () => canvasApi.current?.drawNMOS();
  const handlePMOSClick = () => canvasApi.current?.drawPMOS();

  const handleINClick = () => canvasApi.current?.drawIN();
  const handleOUTClick = () => canvasApi.current?.drawOUT();
  const handleInOutClick = () => canvasApi.current?.drawInOut();

  const handleVDCClick = () => canvasApi.current?.drawVDC();
  const handleVSSIClick = () => canvasApi.current?.drawVSSI();
  const handleVDDIClick = () => canvasApi.current?.drawVDDI();

  // const handleANDClick = () => canvasApi.current?.drawAND?.();
  // const handleORClick  = () => canvasApi.current?.drawOR?.();
  const handleNOTClick = () => canvasApi.current?.drawNOT();
  const handleNANDClick = () => canvasApi.current?.drawNAND();
  const handleNORClick = () => canvasApi.current?.drawNOR();
  const handleXORClick = () => canvasApi.current?.drawXOR();

  // Actions
  const handleRotateClick = (dir = "cw") => canvasApi.current?.rotateSelected(dir);
  const handleDeleteClick = () => canvasApi.current?.deleteSelected();
  const handleClearAllClick = () => setShowClearModal(true);
  const confirmClearAll = () => {
    canvasApi.current?.clearAll();
    setShowClearModal(false);
  };
  const handleDownloadClick = () => canvasApi.current?.downloadCircuit();
  const handleResetView = () => canvasApi.current?.resetView();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      
      <ComponentPanel
        onResistorClick={handleResistorClick}
        onCapacitorClick={handleCapacitorClick}
        onInductorClick={handleInductorClick}
        onDiodeClick={handleDiodeClick}
        onNPNClick={handleNPNClick}
        onPNPClick={handlePNPClick}
        onNMOSClick={handleNMOSClick}
        onPMOSClick={handlePMOSClick}
        onINClick={handleINClick}
        onOUTClick={handleOUTClick}
        onInOutClick={handleInOutClick}
        onVDCClick={handleVDCClick}
        onVSSIClick={handleVSSIClick}
        onVDDIClick={handleVDDIClick}
        // onANDClick={handleANDClick}
        // onORClick={handleORClick}
        onNOTClick={handleNOTClick}
        onNANDClick={handleNANDClick}
        onNORClick={handleNORClick}
        onXORClick={handleXORClick}
        onDownloadClick={handleDownloadClick}
        onRotateClick={handleRotateClick}
        onDeleteClick={handleDeleteClick}
        onClearAllClick={handleClearAllClick}
        onResetViewClick={handleResetView}
        canvasRef={canvasApi}
      />
    

      <ClearConfirmModal
        isOpen={showClearModal}
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearModal(false)}
      />
      
      {/* Canvas with floating Toggle on top-right */}
<div className="relative flex-1">
  <Canvas ref={canvasApi} />
</div>
    </div>
  );
};

export default App;
