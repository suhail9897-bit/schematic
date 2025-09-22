import React, { useEffect, useRef, useImperativeHandle, useState } from "react";
import CanvasEngine from "../lib/canvas";
import DownloadPopup from "../extraFiles/downloadpopup";
import { buildAndDownloadNetlist } from "./netlist";

const Canvas = React.forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const roRef = useRef(null);

   const [askNameOpen, setAskNameOpen] = useState(false);
   const [proposedCell, setProposedCell] = useState("");


  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    // Engine create
    engineRef.current = new CanvasEngine(canvas);

    const setSize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      engineRef.current.resize(w, h);
      engineRef.current.draw();
    };

    setSize();

    // Observe parent size (maximize/restore/down etc.)
    if ("ResizeObserver" in window) {
      roRef.current = new ResizeObserver(setSize);
      roRef.current.observe(parent);
    } else {
      const onWindowResize = () => setSize();
      window.addEventListener("resize", onWindowResize);
      roRef.current = { disconnect: () => window.removeEventListener("resize", onWindowResize) };
    }

    return () => {
      if (roRef.current) roRef.current.disconnect();
    };
  }, []);

  // ---- Utilities moved from App: download/rotate/delete/clearAll ----
 // 1) UI trigger: open Tailwind modal
  const downloadCircuit = () => {
    // optionally a smart default; for now always propose "A"
    setProposedCell("");
    setAskNameOpen(true);
  };

  const rotateSelected = (dir = "cw") => engineRef.current?.rotateSelected?.(dir);
  const deleteSelected = () => engineRef.current?.deleteSelected?.();
  const clearAll = () => engineRef.current?.clearAll?.();

  // Expose engine APIs to parent (names mapped 1:1 with your latest App)
  useImperativeHandle(
    ref,
    () => ({
      // component add
      drawResistor: () => engineRef.current?.drawResistorAt(0, 0),
      drawCapacitor: () => engineRef.current?.drawCapacitorAt(0, 0),
      drawInductor: () => engineRef.current?.drawInductorAt(0, 0),
      drawDiode: () => engineRef.current?.drawDiodeAt(0, 0),

      drawNPN: () => engineRef.current?.drawNPNAt(0, 0),
      drawPNP: () => engineRef.current?.drawPNPAt(0, 0),
      drawNMOS: () => engineRef.current?.drawNMOSAt(0, 0),
      drawPMOS: () => engineRef.current?.drawPMOSAt(0, 0),

      drawIN: () => engineRef.current?.drawINAt(0, 0),
      drawOUT: () => engineRef.current?.drawOUTAt(0, 0),
      drawInOut: () => engineRef.current?.drawInOutAt(0, 0),

      drawVDC: () => engineRef.current?.drawVDCAt(0, 0),
      drawVSSI: () => engineRef.current?.drawVSSIAt(0, 0),
      drawVDDI: () => engineRef.current?.drawVDDIAt(0, 0),

      // logic (AND/OR commented in latest App; keeping exposed only used ones)
      drawNOT: () => engineRef.current?.drawNOTAt(0, 0),
      drawNAND: () => engineRef.current?.drawNANDAt(0, 0),
      drawNOR: () => engineRef.current?.drawNORAt(0, 0),
      drawXOR: () => engineRef.current?.drawXORAt(0, 0),

      // actions
      rotateSelected,
      deleteSelected,
      clearAll,
      downloadCircuit,
      resetView: () => engineRef.current?.resetView(),
      getSelected: () => engineRef.current?.getSelectedSnapshot(),
      updateSelected: (patch) => engineRef.current?.updateSelected(patch),
      getResValueVM:    () => engineRef.current?.getResValueVM?.(),
      setResValueFromUI: (p) => engineRef.current?.setResValueFromUI?.(p),
      getCapValueVM:     () => engineRef.current?.getCapValueVM?.(),
      setCapValueFromUI: (p) => engineRef.current?.setCapValueFromUI?.(p),
      getIndValueVM:     () => engineRef.current?.getIndValueVM?.(),
      setIndValueFromUI: (p) => engineRef.current?.setIndValueFromUI?.(p),
      getDiodeAreaVM: () => engineRef.current?.getDiodeAreaVM?.(),
      setDiodeAreaFromUI: (p) => engineRef.current?.setDiodeAreaFromUI?.(p),
      getNpnAreaVM:        () => engineRef.current?.getNpnAreaVM?.(),
      setNpnAreaFromUI:    (p) => engineRef.current?.setNpnAreaFromUI?.(p),
      getPnpAreaVM:      () => engineRef.current?.getPnpAreaVM?.(),
      setPnpAreaFromUI:  (p) => engineRef.current?.setPnpAreaFromUI?.(p),
      // useImperativeHandle(...):
      getNmosVM:      () => engineRef.current?.getNmosVM?.(),
      setNmosFromUI:  (p) => engineRef.current?.setNmosFromUI?.(p),
      getPmosVM:      () => engineRef.current?.getPmosVM?.(),
      setPmosFromUI:  (p) => engineRef.current?.setPmosFromUI?.(p),
      getNandVM: () => engineRef.current?.getNandVM?.(),
      setNandFromUI: (p) => engineRef.current?.setNandFromUI?.(p),
      getNorVM:     () => engineRef.current?.getNorVM?.(),
      setNorFromUI: (p) => engineRef.current?.setNorFromUI?.(p),
      getXorVM:      () => engineRef.current?.getXorVM?.(),
      setXorFromUI:  (p) => engineRef.current?.setXorFromUI?.(p),
      getNotVM:     () => engineRef.current?.getNotVM?.(),
      setNotFromUI: (p) => engineRef.current?.setNotFromUI?.(p),
      getVdcVM:      () => engineRef.current?.getVdcVM?.(),
      setVdcFromUI:  (p) => engineRef.current?.setVdcFromUI?.(p),
      exportDesignFile: () => engineRef.current?.buildDesignSnapshot?.(),
      importDesignFile: (data) => engineRef.current?.loadDesignSnapshot?.(data),
      setNetLabelsVisible: (v) => engineRef.current?.setNetLabelsVisible?.(v),
      getNetLabelsVisible: () => engineRef.current?.getNetLabelsVisible?.(),
      setDeviceLabelsVisible: (v) => engineRef.current?.setDeviceLabelsVisible?.(v),
      getDeviceLabelsVisible: () => engineRef.current?.getDeviceLabelsVisible?.(),
      toggleDeviceLabelsVisible: () => engineRef.current?.toggleDeviceLabelsVisible?.(),
      setPropertyLabelsVisible: (v) => engineRef.current?.setPropertyLabelsVisible?.(v),
      getPropertyLabelsVisible: () => engineRef.current?.getPropertyLabelsVisible?.(),



    }),
    []
  );

   return (
    <>
      <canvas ref={canvasRef} className="flex-1 bg-black block" />
      <DownloadPopup
        open={askNameOpen}
        initialValue={proposedCell}
        onCancel={() => setAskNameOpen(false)}
        onSave={(val) => {
        setAskNameOpen(false);
        buildAndDownloadNetlist(engineRef.current, val);
      }}
      />
    </>
  );
});

export default Canvas;
