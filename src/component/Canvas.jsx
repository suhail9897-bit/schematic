import React, { useEffect, useRef, useImperativeHandle, useState } from "react";
import CanvasEngine from "../lib/canvas";
import { extractBoxSpecFromDesign } from "../lib/parseBoxFromDesign";
import DownloadPopup from "../extraFiles/downloadpopup";
import { buildAndDownloadNetlist, buildNetlistString } from "./netlist";
import WireActions from "../extraFiles/Wirecolor";

const Canvas = React.forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const roRef = useRef(null);
  // 🔵 smart-draw state (React-side)
  const [placing, setPlacing] = useState(null); // { type, rot } | null
  const [ghost, setGhost] = useState(null);     // { x,y } WORLD (snapped)

   const [askNameOpen, setAskNameOpen] = useState(false);
   const [proposedCell, setProposedCell] = useState("");
   const [scissorAnchor, setScissorAnchor] = useState(null);
   const [viewport, setViewport] = useState({ offsetX: 0, offsetY: 0, scale: 1 });
   const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });


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

  // 🔵 smart-draw helpers (world <-> screen)
    const worldFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { offsetX, offsetY, scale } = (engineRef.current?.uiHooks?.lastViewport || viewport);
    const wx = (sx - offsetX) / scale;
    const wy = (sy - offsetY) / scale;
    return { x: Math.round(wx / engineRef.current.gridSize) * engineRef.current.gridSize,
             y: Math.round(wy / engineRef.current.gridSize) * engineRef.current.gridSize };
  };


    // 🔗 Wire-cut overlay hook: engine -> React
  useEffect(() => {
  const eng = engineRef.current;
  if (!eng) return;

  // preserve anything else already on uiHooks
  eng.uiHooks = {
    ...(eng.uiHooks || {}),
    onWireHit: (anchor) => setScissorAnchor(anchor), // null or {x,y} (WORLD)
     onViewport: (vp) => {
        setViewport(vp);
        if (eng.uiHooks) eng.uiHooks.lastViewport = vp;
      },
  };

    return () => {
      if (engineRef.current) engineRef.current.uiHooks = null;
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

          // Create subckt box from uploaded design JSON
      createBoxFromDesign: (json, filename = "DESIGN") => {
        try {
          const spec = extractBoxSpecFromDesign(json, filename);
          return engineRef.current?.addSubcktBox?.(spec);
        } catch (e) {
          console.error(e);
          alert("Could not create box from this file.");
          return null;
        }
      },
       getNetlistString: (cellName = "CIRCUIT") =>
       buildNetlistString(engineRef.current, cellName),
      // component add
      // 🔵 SMART-DRAW togglers (icons call these)
      togglePlacement: (type) => {
        setPlacing((p) => (p && p.type === type ? null : { type, rot: 0 }));
        if (engineRef.current?.setPlacementGhost) {
          engineRef.current.setPlacementGhost(null); // clear on toggle
        }
      },
      // (legacy) origin-add APIs kept for back-compat
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
      // Marquee select (box select) proxies
      getMarqueeEnabled: () => !!engineRef.current?.getMarqueeEnabled?.(),
      // Canvas.jsx (inside useImperativeHandle return object)
      setMarqueeEnabled: (on) => {
        engineRef.current?.setMarqueeEnabled?.(on);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = on ? 'crosshair' : '';
        }
      },

      toggleMarqueeEnabled: () => {
        const next = !engineRef.current?.getMarqueeEnabled?.();
        engineRef.current?.setMarqueeEnabled?.(next);
        return next;
      },


    }),
    []
  );

  const scPos = React.useMemo(() => {
  if (!scissorAnchor || !canvasRef.current) return null;

  const rect = canvasRef.current.getBoundingClientRect();
  const { offsetX, offsetY, scale } = viewport; // kept via onViewport

  return {
    left: rect.left + offsetX + scissorAnchor.x * scale,
    top:  rect.top  + offsetY + scissorAnchor.y * scale,
  };
}, [scissorAnchor, viewport, canvasSize]);

 // 🔵 overlay events when placing
  const onOverlayMove = (e) => {
    if (!placing) return;
    const p = worldFromEvent(e);
    setGhost(p);
    engineRef.current?.setPlacementGhost?.({
      type: placing.type, x: p.x, y: p.y, angle: (placing.rot || 0)
    });
  };
  const onOverlayClick = (e) => {
    if (!placing) return;
    const ok = engineRef.current?.placeGhostNow?.(); // overlap check + commit
    if (ok) {
      // keep mode on for multi-place; comment next line to auto-exit
      // setPlacing(null);
    }
  };
  useEffect(() => {
    const onKey = (e) => {
      if (!placing) return;
      if (e.key === 'Escape') {
        setPlacing(null);
        engineRef.current?.setPlacementGhost?.(null);
        window.dispatchEvent(new CustomEvent('smartdraw:cancel'));
      } else if (e.key.toLowerCase() === 'r') {
        setPlacing(p => {
          const next = ((p?.rot || 0) + Math.PI / 2) % (Math.PI * 2);
          engineRef.current?.rotateGhostTo?.(next);
          return { ...(p || {}), rot: next };
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placing]);



   return (
    <>
      <canvas ref={canvasRef} className="flex-1 bg-black block" />

      {/* 🔵 Placement overlay (captures only when active) */}
      {placing && (
        <div
          className="absolute inset-0 z-20 cursor-crosshair"
          onMouseMove={onOverlayMove}
          onClick={onOverlayClick}
        />
      )}
      {scPos && scissorAnchor?.wireId && (
      <WireActions
       initialColor={engineRef.current?.getWireColor?.(scissorAnchor.wireId)}
        left={scPos.left}
        top={scPos.top}
        onCut={() => engineRef.current?.cutSelectedWire?.()}
        onPick={(payload) => {
          const { color, wholeNet } =
            typeof payload === "string" ? { color: payload, wholeNet: false } : (payload || {});
          if (!color) return;
          if (wholeNet) {
            engineRef.current?.setNetColorByWireId?.(scissorAnchor.wireId, color);
          } else {
            engineRef.current?.setWireColor?.(scissorAnchor.wireId, color);
          }
        }}
        onClose={() => {
          engineRef.current?.clearWireCut?.();
          setScissorAnchor(null);
        }}
      />
    )}
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
