import React, { useEffect, useState } from "react";

export default function EditSubcktBox({ engine, selected }) {
  const [value, setValue] = useState("");

  // keep input in sync with current selection (always uppercase)
  useEffect(() => {
    const initial = String(selected?.subckt?.name || selected?.label || "");
    setValue(initial.toUpperCase());
  }, [selected?.id]);

  const onChange = (e) => {
    const up = e.target.value.toUpperCase(); // force caps
    setValue(up);
    // live update (same as before)
    engine?.updateSelected?.({ subckt: { name: up }, label: up });
  };

  if (!selected || selected.type !== "subcktbox") return null;

  return (
    <div className="px-2 ">
      <label className="w-15 text-gray-400 text-xs">Box name</label>
      <input
        className="w-full mt-[2px] px-[8px] py-[4px] bg-[#111] text-[#eee] border border-[#444] rounded outline-none focus:border-gray-400"
        value={value}
        onChange={onChange}
        placeholder="e.g. DESIGNA"
        autoComplete="off"
        spellCheck={false}
      />
      
    </div>
  );
}
