import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import npnIcon from "../assets/icons8-npn-64.png";
import pnpIcon from "../assets/icons8-pnp-64.png";
import inductorIcon from "../assets/icons8-inductor-64.png";
import capacitorIcon from "../assets/icons8-capacitor-64.png"
import resistorIcon from "../assets/icons8-resistor-64.png";
import diodeIcon from "../assets/icons8-diode-64.png";
import nmosIcon from "../assets/iconNmos.png";
import pmosIcon from "../assets/iconPmos.png";
import inIcon from "../assets/iconIn.png";
import outIcon from "../assets/iconOut.png";
import inoutIcon from "../assets/iconInout.png";
import vssiIcon from "../assets/iconVssi.png";
import dcIcon from "../assets/iconDc.png";
import notIcon from "../assets/iconNot.png";
import nandIcon from "../assets/iconNand.png";
import norIcon from "../assets/iconNor.png";
import xorIcon from "../assets/iconXor.png";
import vddiIcon from "../assets/iconVdd.png";
import Tooltip from "../extraFiles/tooltip";


/* square icon button */
const iBtn =
  "shrink-0 w-10 h-10 flex items-center justify-center rounded " +
  "bg-[#111] border border-gray-600/60 text-gray-100 " +
  "hover:bg-[#1a1a1a] hover:border-gray-400/70 transition";

/* ---- icons (same as before) ---- */
const IconResistor = (p) => (
  <img
    src={resistorIcon}
    alt="resistor"
    width="22"
    height="22"
    {...p}
  />
);
const IconCapacitor = (p) => (
  <img
    src={capacitorIcon}
    alt="capacitor"
    width="20"
    height="20"
    {...p}
  />
);
const IconInductor = (p) => (
  <img
    src={inductorIcon}
    alt="inductor"
    width="20"
    height="20"
    {...p}
  />
);
const IconDiode     = (p)=> (
  <img
    src={diodeIcon}
    alt="diode"
    width="20"
    height="20"
    {...p}
  />
);
const IconNPN = (p) => (
  <img
    src={npnIcon}
    alt="NPN"
    width="20"
    height="20"
    {...p}
  />
);
const IconPNP = (p) => (
  <img
    src={pnpIcon}
    alt="pnp"
    width="20"
    height="20"
    {...p}
  />
);


const IconNMOS = (p) => (
  <img
    src={nmosIcon}
    alt="nmos"
    width="20"
    height="20"
    {...p}
  />
);
const IconPMOS = (p) => (
  <img
    src={pmosIcon}
    alt="pmos"
    width="20"
    height="20"
    {...p}
  />
);

const IconIn = (p) => (
  <img
    src={inIcon}
    alt="In"
    width="20"
    height="20"
    {...p}
  />
);

const IconOut = (p) => (
  <img
    src={outIcon}
    alt="out"
    width="20"
    height="20"
    {...p}
  />
);

const IconInOut = (p)=>(
   <img
    src={inoutIcon}
    alt="In-Out"
    width="20"
    height="20"
    {...p}
  />
);

const IconVDC = (p)=>(
  <img
    src={dcIcon}
    alt="VDC"
    width="20"
    height="20"
    {...p}
  />
);
 
const IconVSSI = (p)=>(
   <img
    src={vssiIcon}
    alt="VSSI"
    width="20"
    height="20"
    {...p}
  />
);
 
const IconVDDI = (p)=>(
    <img
    src={vddiIcon}
    alt="VDD"
    width="20"
    height="20"
    {...p}
  />
);
 
const IconNOT = (p)=>(
  <img
    src={notIcon}
    alt="Not"
    width="20"
    height="20"
    {...p}
  />
);
const IconNAND = (p)=>(
  <img
    src={nandIcon}
    alt="Nand"
    width="20"
    height="20"
    {...p}
  />
);
const IconNOR = (p)=>(
  <img
    src={norIcon}
    alt="Nor"
    width="20"
    height="20"
    {...p}
  />
);
const IconXOR = (p)=>(
  <img
    src={xorIcon}
    alt="Xor"
    width="20"
    height="20"
    {...p}
  />
);
  

export default function LeftSidebar({
  onResistorClick, onCapacitorClick, onInductorClick,
  onDiodeClick, onNPNClick, onPNPClick, onNMOSClick, onPMOSClick,
  onINClick, onOUTClick, onInOutClick, onVDCClick, onVSSIClick, onVDDIClick,
  onNOTClick, onNANDClick, onNORClick, onXORClick,
}) {
  const [open, setOpen] = useState(true);
  const [activeType, setActiveType] = useState(null); // 'resistor' | 'capacitor' | ...
 const btn = (type, onClick, children) => (
   <button
     className={`${iBtn} ${activeType===type ? 'ring-1 ring-green-500 bg-[#1e1e1e]' : ''}`}
     onClick={() => { setActiveType(t => t===type ? null : type); onClick?.(); }}
   >
     {children}
   </button>
 );
 useEffect(() => {
  const off = () => setActiveType(null);
  window.addEventListener('smartdraw:cancel', off);
  return () => window.removeEventListener('smartdraw:cancel', off);
}, []);



  return (
    <div className="relative inline-block text-left">
      {/* toggle icon stays in the ComponentPanel strip */}
      <Tooltip text="Components">
      <button
        onClick={() => setOpen(!open)}
        className="bg-[#1e1e1e] text-white px-2 py-1.5 rounded shadow hover:bg-[#555] transition-colors duration-200 flex items-center gap-2" 
      >
        
        {open ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      </Tooltip>

      {/* HORIZONTAL full-width dropdown just under the strip */}
      {open && (
         <div className="fixed left-0 right-0 top-[50px] z-40"> {/* <-- yahan fixed */}
    <div className="relative overflow-hidden rounded-2xl
                    bg-gradient-to-br from-[#242424]/95 to-[#171717]/95
                    backdrop-blur-md border border-white/10 ring-1 ring-white/5
                    shadow-[0_10px_40px_rgba(0,0,0,0.6)] ">
            {/* glossy overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-[inherit]">
              <div className="absolute inset-x-0 -top-6 h-12 bg-gradient-to-b from-white/12 to-transparent" />
              <div className="absolute inset-0 rounded-[inherit] ring-1 ring-white/5" />
            </div>

            {/* scroll area */}
            <div className="relative overflow-x-auto">
            

<div className="flex items-center gap-2 px-3 py-2 min-w-max">
  {/* PASSIVE */}
<Tooltip text="Resistor">
  {btn('resistor', onResistorClick, <IconResistor />)}
</Tooltip>

<Tooltip text="Capacitor">
  {btn('capacitor', onCapacitorClick, <IconCapacitor />)}
</Tooltip>

<Tooltip text="Inductor">
  {btn('inductor', onInductorClick, <IconInductor />)}
</Tooltip>

<span className="mx-1 w-px h-6 bg-white/10 rounded " />

{/* ACTIVE */}
<Tooltip text="Diode">
  {btn('diode', onDiodeClick, <IconDiode />)}
</Tooltip>

    <Tooltip text="NPN">
      {btn('npn', onNPNClick, <IconNPN />)}
    </Tooltip>

    <Tooltip text="PNP">
      {btn('pnp', onPNPClick, <IconPNP />)}
    </Tooltip>

    <Tooltip text="NMOS">
      {btn('nmos', onNMOSClick, <IconNMOS />)}
    </Tooltip>

    <Tooltip text="PMOS">
      {btn('pmos', onPMOSClick, <IconPMOS />)}
    </Tooltip>

    <span className="mx-1 w-px h-6 bg-white/10 rounded" />

    {/* IO */}
    <Tooltip text="In">
      {btn('in', onINClick, <IconIn />)}
    </Tooltip>

    <Tooltip text="Out">
      {btn('out', onOUTClick, <IconOut />)}
    </Tooltip>

    <Tooltip text="In-Out">
      {btn('in-out', onInOutClick, <IconInOut />)}
    </Tooltip>

    <Tooltip text="VDC">
      {btn('vdc', onVDCClick, <IconVDC />)}
    </Tooltip>

    <Tooltip text="VSSI">
      {btn('vssi', onVSSIClick, <IconVSSI />)}
    </Tooltip>

    <Tooltip text="VDDI">
      {btn('vddi', onVDDIClick, <IconVDDI />)}
    </Tooltip>

    <span className="mx-1 w-px h-6 bg-white/10 rounded" />

    {/* GATES */}
    <Tooltip text="NOT">
      {btn('not', onNOTClick, <IconNOT />)}
    </Tooltip>

    <Tooltip text="NAND">
      {btn('nand', onNANDClick, <IconNAND />)}
    </Tooltip>

    <Tooltip text="NOR">
      {btn('nor', onNORClick, <IconNOR />)}
    </Tooltip>

    <Tooltip text="XOR">
      {btn('xor', onXORClick, <IconXOR />)}
    </Tooltip>
</div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
