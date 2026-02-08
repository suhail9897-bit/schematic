import React, { useRef, useState } from "react";
import ComponentPanel from "./component/componentpanel";
import ClearConfirmModal from "./extraFiles/confirm";
import Canvas from "./component/Canvas";


const App = () => {
  const canvasApi = useRef(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Component add handlers → Canvas ref API
  const handleResistorClick = () => canvasApi.current?.togglePlacement('resistor');
  const handleCapacitorClick = () => canvasApi.current?.togglePlacement('capacitor');
  const handleInductorClick = () => canvasApi.current?.togglePlacement('inductor');
  const handleWireClick = () => canvasApi.current?.togglePlacement('manualWire');
  const handleDiodeClick = () => canvasApi.current?.togglePlacement('diode');

  const handleNPNClick = () => canvasApi.current?.togglePlacement('npn');
  const handlePNPClick = () => canvasApi.current?.togglePlacement('pnp');
  const handleNMOSClick = () => canvasApi.current?.togglePlacement('nmos');
  const handlePMOSClick = () => canvasApi.current?.togglePlacement('pmos');

  const handleINClick = () => canvasApi.current?.togglePlacement('in');
  const handleOUTClick = () => canvasApi.current?.togglePlacement('out');
  const handleInOutClick = () => canvasApi.current?.togglePlacement('in-out');

  const handleVDCClick = () => canvasApi.current?.togglePlacement('vdc');
  const handleVSSIClick = () => canvasApi.current?.togglePlacement('vssi');
  const handleVDDIClick = () => canvasApi.current?.togglePlacement('vddi');

  // const handleANDClick = () => canvasApi.current?.drawAND?.();
  // const handleORClick  = () => canvasApi.current?.drawOR?.();
  const handleNOTClick = () => canvasApi.current?.togglePlacement('not');
  const handleNANDClick = () => canvasApi.current?.togglePlacement('nand');
  const handleNORClick = () => canvasApi.current?.togglePlacement('nor');
  const handleXORClick = () => canvasApi.current?.togglePlacement('xor');

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
        onWireClick={handleWireClick}
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
