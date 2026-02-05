import React, { useState, useRef, useEffect } from 'react';
import { FaDownload, FaTrashAlt,  FaBroom, FaUpload } from 'react-icons/fa';
import { MdRotateRight, MdRotateLeft, MdUndo, MdRedo, MdSelectAll } from "react-icons/md";
import { FiEye,  FiEyeOff } from "react-icons/fi";
import Tooltip from '../extraFiles/tooltip';
import Toggle from '../dropdowns/toggle';
import LeftSidebar from '../dropdowns/leftsidebar';
import { Cpu } from 'lucide-react';
import { openDesignDownload, triggerDesignUpload } from '../extraFiles/designpopup';

// Square-with-corners icon (matches 18px toolbar size)
const ResetViewSquare = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    {/* outer square */}
    <rect x="2" y="2" width="14" height="14" rx="2"
          stroke="currentColor" strokeWidth="2" />

    {/* subtle inner fill */}
    <rect x="3.5" y="3.5" width="11" height="11" rx="1.5"
          fill="currentColor" opacity="0.12" />

    {/* small filled corners */}
    <rect x="3.5" y="3.5" width="3" height="3" rx="0.8"
          fill="currentColor" opacity="0.35" />
    <rect x="11.5" y="3.5" width="3" height="3" rx="0.8"
          fill="currentColor" opacity="0.35" />
    <rect x="3.5" y="11.5" width="3" height="3" rx="0.8"
          fill="currentColor" opacity="0.35" />
    <rect x="11.5" y="11.5" width="3" height="3" rx="0.8"
          fill="currentColor" opacity="0.35" />
  </svg>
);

// Tiny chart icon (waveform)
const WaveformIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <polyline points="5,16 8,12 11,14 14,9 17,11 20,7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

// Small circular badge
// --- replace old LetterBadge component ---
const LetterBadge = ({ label }) => (
  <span className="text-[12px] font-bold leading-none select-none">{label}</span>
);


// Single composite button: Eye + Letter
const EyeLetterBtn = ({ label, onClick, open = true }) => (
  <button
    className="bg-[#1e1e1e] text-white px-2 py-1.5 rounded hover:bg-[#555] transition flex items-center gap-1"
    onClick={onClick}>
    {open ? <FiEye size={15} /> : <FiEyeOff size={15} />}
    <LetterBadge label={label} />
  </button>
);



const ComponentPanel = ({ 
  canvasRef,
  onResistorClick,
  onCapacitorClick,
  onInductorClick,
  onDiodeClick,
  onNPNClick,
  onPNPClick,
  onNMOSClick,
  onPMOSClick,
  onINClick,
  onOUTClick,
  onInOutClick,
  onVDCClick,
  onVSSIClick,
  onVDDIClick,
  // onANDClick,
  // onORClick,
  onNOTClick,
  onNANDClick,
  onNORClick,
  onXORClick,
  onDownloadClick, 
  onRotateClick,
  onDeleteClick,
  onClearAllClick,
  onResetViewClick
  }) => {

  // hidden input for "Create box"
  const boxFileRef = React.useRef(null);
  const handleCreateBoxPick = () => boxFileRef.current?.click();
  const handleCreateBoxFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
   reader.onload = () => {
  try {
    const json = JSON.parse(String(reader.result || '{}'));

    // already in your upload handler:
    const comp = canvasRef.current?.createBoxFromDesign?.(json, file.name);

    // NEW: get the subckt captured for THIS box
    if (comp && canvasRef.current?.getSubcktForBox) {
      const entry = canvasRef.current.getSubcktForBox(comp.id);
      // entry shape:
      // { boxId, boxLabel, fileName, subcktName, subcktLines, fullCirLines }
      console.log("BOX SUBCKT:", entry?.subcktName);
      // e.g. to see the block as text:
      console.log(entry?.subcktLines?.join("\n"));
    }

    // (Snippet-2 goes here; see below)
     // NEW: read the whole session collection (optional)
  if (canvasRef.current?.getSubcktLibrary) {
    const lib = canvasRef.current.getSubcktLibrary();
    console.log("Total stored blocks:", lib.size);
    console.table(lib.entries);
  }

  } catch (err) {
    alert('Invalid design JSON for box.');
  } finally {
    e.target.value = '';
  }
};

    reader.readAsText(file);
  };
  

 const btn = "bg-[#1e1e1e] text-white px-2 py-1.5 rounded hover:bg-[#555] transition ";
 const [netsVisible, setNetsVisible] = useState(true);
  useEffect(() => {
    const v = canvasRef?.current?.getNetLabelsVisible?.();
    if (typeof v === 'boolean') setNetsVisible(v);
  }, [canvasRef]);

// NEW: device-name visibility state (for D eye icon)
const [devicesVisible, setDevicesVisible] = useState(true);
const [propsVisible, setPropsVisible] = useState(true);
useEffect(() => {
  const d = canvasRef?.current?.getDeviceLabelsVisible?.();
  if (typeof d === 'boolean') setDevicesVisible(d);
  const p = canvasRef?.current?.getPropertyLabelsVisible?.();
  if (typeof p === 'boolean') setPropsVisible(p);
}, [canvasRef]);

// panel component function ke start me:
const [multiSelOn, setMultiSelOn] = useState(false);

useEffect(() => {
  // read current from canvas once when panel mounts
  const on = !!canvasRef.current?.getMarqueeEnabled?.();
  setMultiSelOn(on);
}, [canvasRef]);

   return (
    <div className="h-[50px] bg-[#1e1e1e] text-white flex items-center justify-between px-5 border-b border-[#333] flex-shrink-0 gap-2 relative z-50">

  {/* Left group: LOGICKNOTS + LeftSidebar + Icons */}
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 font-bold text-lg tracking-wide">
      <Cpu size={20} className="text-green-500" />
      <span>
        schemat<span className="text-green-500">IC</span>
      </span>
    </div>
      <LeftSidebar
         onResistorClick={onResistorClick}
         onCapacitorClick={onCapacitorClick}
         onInductorClick={onInductorClick}
         onDiodeClick={onDiodeClick}
         onNPNClick={onNPNClick}
         onPNPClick={onPNPClick}
         onNMOSClick={onNMOSClick}
         onPMOSClick={onPMOSClick}
         onINClick={onINClick}
         onOUTClick={onOUTClick}
         onInOutClick={onInOutClick}
         onVDCClick={onVDCClick}
         onVSSIClick={onVSSIClick}
         onVDDIClick={onVDDIClick}
         onNOTClick={onNOTClick}
         onNANDClick={onNANDClick}
         onNORClick={onNORClick}
         onXORClick={onXORClick}
       />
      

  <div className="flex items-center gap-2">
  <Tooltip text="Download Netlist">
    <button
      className={btn}
      onClick={onDownloadClick}
    >
      <FaDownload size={15} />
    </button>
  </Tooltip>

  <Tooltip text="Rotate 90° CW">
    <button
      className={btn}
      onClick={() => onRotateClick("cw")}
    >
      <MdRotateRight size={20} />
    </button>
  </Tooltip>

  <Tooltip text="Rotate 90° CCW">
    <button
     className={btn}
      onClick={() => onRotateClick("ccw")}
    >
      <MdRotateLeft size={20} />
    </button>
  </Tooltip>

  <Tooltip text="Delete Selected">
    <button
      className={btn}
      onClick={onDeleteClick}
    >
      <FaTrashAlt size={14} />
    </button>
  </Tooltip>

  <Tooltip text="Clear All">
    <button
     className={btn}
      onClick={onClearAllClick}
    >
      <FaBroom size={16} />
    </button>
  </Tooltip>

  <Tooltip text="Fit to Screen">
    <button
      className={btn}
      onClick={onResetViewClick}
    >
      <ResetViewSquare size={18} />
    </button>
  </Tooltip>

     {/* NEW: View waveform button */}
          <Tooltip text="View waveform">
            <button
              className={btn}
              onClick={() => console.log("waveform clicked")}
              aria-label="View waveform"
              
            >
              <WaveformIcon size={18} />
            </button>
          </Tooltip>
           {/* SINGLE BUTTONS: Eye + N / D / P */}
          <Tooltip text="Visible Net">
             <EyeLetterBtn
            label="N"
            open={netsVisible}
            onClick={() => {
              const next = !netsVisible;
              setNetsVisible(next);
              canvasRef?.current?.setNetLabelsVisible?.(next);
            }}
          />
          </Tooltip>

          <Tooltip text="Visible Device">
          <EyeLetterBtn
            label="D"
            open={devicesVisible}
            onClick={() => {
              const next = !devicesVisible;
              setDevicesVisible(next);
              // use setter to stay in sync with state
              canvasRef.current?.setDeviceLabelsVisible?.(next);
            }}
          />
        </Tooltip>

            <Tooltip text="Visible Property">
    <EyeLetterBtn
      label="P"
      open={propsVisible}
      onClick={() => {
        const next = !propsVisible;
        setPropsVisible(next);
        canvasRef?.current?.setPropertyLabelsVisible?.(next);
      }}
    />
  </Tooltip>
          <Tooltip text="Visible Cellname">
            <EyeLetterBtn label="C" onClick={() => console.log('clicked: show C')} />
          </Tooltip>

           <Tooltip text="Undo">
            <button
            className={btn} 
            onClick={() => canvasRef.current?.undo?.()}
            >
           <MdUndo size={18} />
            </button>
          </Tooltip>

          <Tooltip text="Redo">
            <button 
            className={btn} 
            onClick={() => canvasRef.current?.redo?.()}
            >
            <MdRedo size={18} />
            </button>
          </Tooltip>
          <Tooltip text="Download Schematic">
          <button
            className={btn}
            onClick={() => openDesignDownload(canvasRef)}
          >
            <FaDownload size={15} />
          </button>
        </Tooltip>
          <Tooltip text="Upload Schematic">
            <button 
            className={btn} 
            onClick={() => triggerDesignUpload(canvasRef)} 
            >
            <FaUpload size={15} />
            </button>
          </Tooltip>

          <Tooltip text="Select multiple">
  <button
    className={`${btn} ${multiSelOn ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-[#1e1e1e]' : ''}`}
    onClick={() => {
      const next = !multiSelOn;
      setMultiSelOn(next);
      canvasRef.current?.setMarqueeEnabled?.(next);
    }}
    
  >
   <MdSelectAll size={16} />
  </button>
</Tooltip>

  <Tooltip text="Create box">
    <button className={btn} onClick={handleCreateBoxPick}>
      <FaUpload size={15} />
    </button>
  </Tooltip>
  <input
    ref={boxFileRef}
    type="file"
    accept="application/json"
    onChange={handleCreateBoxFile}
    style={{ display: 'none' }}
  />


      </div>
      </div>

 {/* Right group: Toggle */}
    <div className="flex items-center">
      <Toggle canvasRef={canvasRef} />
    </div>

    {/* green underline fixed to panel */}
<div className="absolute left-0 bottom-0 w-full h-[1px] bg-green-500 pointer-events-none" />
  </div>
  );
};

export default ComponentPanel;
