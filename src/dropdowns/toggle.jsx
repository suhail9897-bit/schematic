import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Tooltip from "../extraFiles/tooltip";
import EditResistor from "../editcomponents/editresistor";
import EditCapacitor from "../editcomponents/editcapacitor";
import EditInductor from "../editcomponents/editinductor";
import EditDiode from "../editcomponents/editdiode";
import EditNPN from "../editcomponents/editnpn";
import EditPNP from "../editcomponents/editpnp";
import EditNMOS from "../editcomponents/editnmos";
import EditPMOS from "../editcomponents/editpmos";
import EditNAND from "../editcomponents/editnand";
import EditNOR from "../editcomponents/editnor";
import EditXOR from "../editcomponents/editxor";
import EditNOT from "../editcomponents/editnot";
import EditVDC from "../editcomponents/editvdc";
import EditSubcktBox from "../editcomponents/editsubcktbox";

const Toggle = ({ canvasRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("properties");
  const [selected, setSelected] = useState(null);
  const [bodyNet, setBodyNet]   = useState("VSS"); // NMOS
  const [pBodyNet, setPBodyNet] = useState("VDD"); // PMOS


  // Poll selection while dropdown is open (simple & reliable)
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      const snap = canvasRef?.current?.getSelected?.() || null;
      setSelected(snap);
    }, 150);
    return () => clearInterval(id);
  }, [isOpen, canvasRef]);

  useEffect(() => {    //for nmos body terminal
  if (selected?.type === 'nmos') {
    const cur = selected?.nmos?.bodyNet;
    const v = (cur ?? "VSS");
    setBodyNet(v);
    if (cur == null) {
      canvasRef?.current?.setNmosFromUI?.({ bodyNet: v });
    }
  }
}, [selected?.id, selected?.type]);

useEffect(() => {    //for pmos body terminal
  if (selected?.type === 'pmos') {
    const cur = selected?.pmos?.bodyNet;
    const v = (cur ?? "VDD");
    setPBodyNet(v);
    if (cur == null) {
      canvasRef?.current?.setPmosFromUI?.({ bodyNet: v });
    }
  }
}, [selected?.id, selected?.type]);


  const updateSelected = (patch) => {
    canvasRef?.current?.updateSelected?.(patch);
    // optimistic local update:
    const snap = canvasRef?.current?.getSelected?.() || null;
    setSelected(snap);
  };

  
  const onNetChange = (idx, value) => {
    updateSelected({ terminals: { [idx]: { netLabel: value } } });
  };

  const LABEL_MAX = 12;
  // label helper for nets tab
const termTitle = (sel, idx) => {
  const t = String(sel?.type || '').toLowerCase();
  if (t === 'nmos' || t === 'pmos') {
    const map = ['GATE', 'DRAIN', 'SOURCE', 'BODY'];
    return map[idx] ?? `Terminal ${idx}`;
  }
  return `Terminal ${idx}`;
};


// helper: friendly titles for NAND terminals
function nandTermTitle(selected, idx) {
  const nIn = Number(selected?.nand?.inputs || 2);
  // NAND2: [0=In1, 1=In2, 2=Out]
  // NAND3: [0=In1, 1=In2, 3=In3, 2=Out]  (output is fixed at idx=2)
  if (nIn === 3) {
    const map = { 0: "Input 1", 1: "Input 2", 3: "Input 3", 2: "Output" };
    return map[idx] ?? `Terminal ${idx}`;
  } else {
    const map = { 0: "Input 1", 1: "Input 2", 2: "Output" };
    return map[idx] ?? `Terminal ${idx}`;
  }
}

// helper: friendly titles for NOR terminals
function norTermTitle(selected, idx) {
  const nIn = Number(selected?.nor?.inputs || 2);
  // NOR2: [0=In1, 1=In2, 2=Out]
  // NOR3: [0=In1, 1=In2, 3=In3, 2=Out]  (output idx=2 fixed)
  if (nIn === 3) {
    const map = { 0: "Input 1", 1: "Input 2", 3: "Input 3", 2: "Output" };
    return map[idx] ?? `Terminal ${idx}`;
  } else {
    const map = { 0: "Input 1", 1: "Input 2", 2: "Output" };
    return map[idx] ?? `Terminal ${idx}`;
  }
}

// helper: friendly titles for XOR terminals
function xorTermTitle(selected, idx) {
  const nIn = Number(selected?.xor?.inputs || 2);
  // XOR2: [0=In1, 1=In2, 2=Out]
  // XOR3: [0=In1, 1=In2, 3=In3, 2=Out]  (output idx=2 fixed)
  if (nIn === 3) {
    const map = { 0: "Input 1", 1: "Input 2", 3: "Input 3", 2: "Output" };
    return map[idx] ?? `Terminal ${idx}`;
  } else {
    const map = { 0: "Input 1", 1: "Input 2", 2: "Output" };
    return map[idx] ?? `Terminal ${idx}`;
  }
}



  return (
    <div className="relative  inline-block text-left">
      {/* Toggle Button */}
      <Tooltip text="Edit">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#1e1e1e] text-white px-2 py-1.5 rounded shadow hover:bg-[#555] transition-colors duration-200 flex items-center gap-2"
        
      >
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      </Tooltip>
      {/* Dropdown */}
{isOpen && (
  <div className="fixed right-0 mt-[11px] w-48 z-50">
    <div
      className="
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-[#242424]/95 to-[#171717]/95
        backdrop-blur-md
        border border-white/10 ring-1 ring-white/5
        shadow-[0_10px_40px_rgba(0,0,0,0.6)]
       
      "
    >
      {/* glossy glance layer */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit]">
        <div className="absolute inset-x-0 -top-6 h-12 bg-gradient-to-b from-white/12 to-transparent" />
        <div className="absolute inset-0 rounded-[inherit] ring-1 ring-white/5" />
      </div>

      {/* Tabs */}
      <div className="relative">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2 text-sm font-medium transition-colors
              ${activeTab === 'properties'
                ? 'text-white'
                : 'text-gray-300 hover:text-white/90'}
            `}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('nets')}
            className={`py-2 text-sm font-medium transition-colors
              ${activeTab === 'nets'
                ? 'text-white'
                : 'text-gray-300 hover:text-white/90'}
            `}
          >
            Nets/Ports
          </button>
        </div>

        {/* sliding indicator */}
        <span
          className={`absolute bottom-0 h-[2px] w-1/2 bg-green-500 transition-transform duration-300 ease-out
            ${activeTab === 'properties' ? 'translate-x-0' : 'translate-x-full'}
          `}
        />
        {/* subtle tab divider */}
        <div className="absolute bottom-px left-0 right-0 h-px bg-white/10" />
      </div>

          {/* Content */}
          <div className="p-3 text-gray-200 text-sm space-y-3">
            {!selected && (
              <div className="text-gray-400">No selection</div>
            )}

            {selected && activeTab === "properties" && (
              <>
                <div className="text-xs uppercase tracking-wider text-gray-400">
                  {selected.type}
                </div>

                 {/* ===== RESISTOR (unit + magnitude via engine) ===== */}
                    {selected.type === "resistor" && (
                   <EditResistor
                     selected={selected}
                     canvasRef={canvasRef}
                     updateSelected={updateSelected}
                     LABEL_MAX={LABEL_MAX}
                   />
                 )}
                {/* Other components can be added here later */}
             {/* ===== CAPACITOR ===== */}

   {selected?.type === "subcktbox" && (
   <EditSubcktBox engine={canvasRef?.current} selected={selected} />
 )}
 {selected.type === "capacitor" && (
   <EditCapacitor
     selected={selected}
     canvasRef={canvasRef}
     updateSelected={updateSelected}
     LABEL_MAX={LABEL_MAX}
   />
 )}


{/* ===== INDUCTOR ===== */}
 {selected.type === "inductor" && (
   <EditInductor
     selected={selected}
     canvasRef={canvasRef}
     updateSelected={updateSelected}
     LABEL_MAX={LABEL_MAX}
   />
 )}

{/* ===== DIODE: Width (Area) ===== */}
{selected.type === "diode" && (
  <EditDiode
    selected={selected}
    canvasRef={canvasRef}
    LABEL_MAX={LABEL_MAX}
    updateSelected={updateSelected}
  />
)}

{/* ===== NPN (Label + Area) ===== */}
{selected.type === "npn" && (
   <EditNPN
     selected={selected}
     canvasRef={canvasRef}
     updateSelected={updateSelected}
     LABEL_MAX={LABEL_MAX}
   />
 )}

{selected.type === "pnp" && (
   <EditPNP
    selected={selected}
     canvasRef={canvasRef}
     updateSelected={updateSelected}
     LABEL_MAX={LABEL_MAX}
   />
 )}

{selected?.type === 'nmos' && (
   <EditNMOS api={canvasRef.current} />
 )}

{selected?.type === 'pmos' && (
   <EditPMOS api={canvasRef.current} />
 )}

{selected?.type === 'nand' && (
  <EditNAND api={canvasRef.current} />
)}

{selected?.type === 'nor' && (
  <EditNOR api={canvasRef.current} />
)}

{selected?.type === 'xor' && (
  <EditXOR api={canvasRef.current} />
)}

{selected?.type === 'not' && (
  <EditNOT api={canvasRef.current} />
)}

{selected?.type === 'vdc' && (
  <EditVDC api={canvasRef.current} />
)}

              </>
            )}

            {selected && activeTab === "nets" && (
              <>
              {selected.terminals?.map((t) => {
const title =
  selected?.type === "nand"
    ? nandTermTitle(selected, t.index)
  : selected?.type === "nor"
    ? norTermTitle(selected, t.index)
  : selected?.type === "xor"
    ? xorTermTitle(selected, t.index)
    : termTitle(selected, t.index);



  return (
    <div key={t.index} className="flex items-center gap-2">
      <div className="w-15 text-gray-400 text-xs">{title}</div>
      <input
        className="flex-1 min-w-0 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        value={t.netLabel || ""}
        onChange={(e) => onNetChange(t.index, e.target.value)}
      />
    </div>
  );
})}



 {selected?.type === 'nand' && (
  <>
    <div className="flex items-center gap-2">
      <div className="w-10 text-gray-400 text-xs">Power</div>
      <input
        className="flex-1  min-w-0 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        value={selected?.nand?.vddNet ?? ""}
        placeholder="VDD"
        onChange={(e) =>
          canvasRef?.current?.setNandFromUI?.({ vddNet: e.target.value })
        }
      />
    </div>
    <div className="flex items-center gap-2">
      <div className="w-10 text-gray-400 text-xs">Ground</div>
      <input
        className="flex-1 min-w-0 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        value={selected?.nand?.vssNet ?? ""}
        placeholder="VSS"
        onChange={(e) =>
          canvasRef?.current?.setNandFromUI?.({ vssNet: e.target.value })
        }
      />
    </div>
  </>
)}
{selected?.type === 'nor' && (
  <>
    <div className="flex items-center gap-2">
      <div className="w-10 text-gray-400 text-xs">Power</div>
      <input
        className="flex-1 min-w-0 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        value={selected?.nor?.vddNet ?? ""}        // <-- was "?? 'VDD'"
        placeholder="VDD"
        onChange={(e) => canvasRef?.current?.setNorFromUI?.({ vddNet: e.target.value })}
      />
    </div>
    <div className="flex items-center gap-2">
      <div className="w-10 text-gray-400 text-xs">Ground</div>
      <input
        className="flex-1 min-w-0 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        value={selected?.nor?.vssNet ?? ""}        // <-- was "?? 'VSS'"
        placeholder="VSS"
        onChange={(e) => canvasRef?.current?.setNorFromUI?.({ vssNet: e.target.value })}
      />
    </div>
  </>
)}

{selected?.type === 'xor' && (
  <>
    <div className="flex items-center gap-2">
      <div className="w-10 text-gray-400 text-xs">Power</div>
      <input
        className="flex-1 min-w-0 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        value={selected?.xor?.vddNet ?? ""}         // blank allow
        placeholder="VDD"
        onChange={(e) =>
          canvasRef?.current?.setXorFromUI?.({ vddNet: e.target.value })
        }
      />
    </div>
    <div className="flex items-center gap-2">
      <div className="w-10 text-gray-400 text-xs">Ground</div>
      <input
        className="flex-1 min-w-0 bg-[#111] border border-gray-600 rounded px-2 py-1 outline-none focus:border-gray-400"
        value={selected?.xor?.vssNet ?? ""}         // blank allow
        placeholder="VSS"
        onChange={(e) =>
          canvasRef?.current?.setXorFromUI?.({ vssNet: e.target.value })
        }
      />
    </div>
  </>
)}




                {!selected.terminals?.length && (
                  <div className="text-gray-400">No terminals</div>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toggle;
