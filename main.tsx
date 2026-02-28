import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as XLSX from "xlsx";

/**
 * 1. KOMPONEN UI INTERNAL
 * Dibuat di sini agar tidak butuh folder 'components/ui' tambahan.
 */
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden ${className}`}>{children}</div>
);

const CardContent = ({ children, className = "" }: any) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "default", size = "md", className = "" }: any) => {
  const base = "rounded-lg font-semibold transition-all active:scale-95 flex items-center justify-center disabled:opacity-50";
  const variants: any = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  const sizes: any = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Input = (props: any) => (
  <input {...props} className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white ${props.className}`} />
);

const Select = ({ value, onValueChange, children }: any) => (
  <select value={value} onChange={(e) => onValueChange(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full cursor-pointer">
    {children}
  </select>
);

/**
 * 2. APLIKASI UTAMA
 */
function ProductionSystem() {
  const [language, setLanguage] = useState(() => localStorage.getItem("app_language") || "id");
  const [records, setRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem("production_records");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [form, setForm] = useState({ date: "", color: "", shift: "Siang", product: "", quantity: "" });
  const [filterDate, setFilterDate] = useState("");
  const [filterShift, setFilterShift] = useState("all");

  useEffect(() => {
    localStorage.setItem("app_language", language);
    localStorage.setItem("production_records", JSON.stringify(records));
  }, [language, records]);

  const text = {
    id: { title: "SISTEM DATA PRODUKSI", addData: "Tambah Data", date: "Tanggal", color: "Warna", shift: "Shift", product: "Produk", quantity: "Jumlah", save: "Simpan", tableTitle: "Data Produksi", time: "Waktu", reset: "Reset", export: "Ekspor Excel" },
    cn: { title: "生产数据系统", addData: "添加数据", date: "日期", color: "颜色", shift: "班次", product: "产品", quantity: "数量", save: "保存", tableTitle: "生产数据", time: "时间", reset: "重置", export: "导出 Excel" },
  };

  const t = text[language as keyof typeof text];

  const handleSubmit = () => {
    if (!form.date || !form.color || !form.product || !form.quantity) return;
    const newRecord = { 
        id: Date.now(), 
        ...form, 
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
    };
    setRecords([...records, newRecord]);
    setForm({ date: "", color: "", shift: "Siang", product: "", quantity: "" });
  };

  const handleExport = () => {
    const filtered = records.filter(r => (filterDate ? r.date === filterDate : true) && (filterShift !== "all" ? r.shift === filterShift : true));
    const data = filtered.map(r => ({ [t.date]: r.date, [t.time]: r.time, [t.color]: r.color, [t.shift]: r.shift, [t.product]: r.product, [t.quantity]: r.quantity }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `Produksi_${filterDate || "Semua"}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{t.title}</h1>
        <div className="w-32">
          <Select value={language} onValueChange={setLanguage}>
            <option value="id">Indonesia</option>
            <option value="cn">中文 (China)</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-md font-bold mb-4 text-blue-700">{t.addData}</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
            <Input type="date" value={form.date} onChange={(e:any) => setForm({...form, date: e.target.value})} />
            <Input placeholder={t.color} value={form.color} onChange={(e:any) => setForm({...form, color: e.target.value})} />
            <Select value={form.shift} onValueChange={(v:any) => setForm({...form, shift: v})}>
                <option value="Siang">Siang / 白班</option>
                <option value="Malam">Malam / 夜班</option>
            </Select>
            <Input placeholder={t.product} value={form.product} onChange={(e:any) => setForm({...form, product: e.target.value})} />
            <Input type="number" placeholder="Qty" value={form.quantity} onChange={(e:any) => setForm({...form, quantity: e.target.value})} />
            <Button onClick={handleSubmit}>{t.save}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex flex-wrap justify-between gap-4 mb-4">
            <h2 className="font-bold text-gray-700">{t.tableTitle}</h2>
            <div className="flex gap-2">
              <Input type="date" className="w-32" value={filterDate} onChange={(e:any) => setFilterDate(e.target.value)} />
              <Button onClick={handleExport} className="bg-green-600">{t.export}</Button>
            </div>
          </div>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">{t.date}</th>
                  <th className="p-3">{t.color}</th>
                  <th className="p-3">{t.shift}</th>
                  <th className="p-3">{t.product}</th>
                  <th className="p-3">{t.quantity}</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.filter(r => (filterDate ? r.date === filterDate : true) && (filterShift !== "all" ? r.shift === filterShift : true)).map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{r.date}</td>
                    <td className="p-3">{r.color}</td>
                    <td className="p-3">{r.shift}</td>
                    <td className="p-3 font-medium">{r.product}</td>
                    <td className="p-3 font-bold text-blue-600">{r.quantity}</td>
                    <td className="p-3">
                      <button onClick={() => setRecords(records.filter(i => i.id !== r.id))} className="text-red-500 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 3. RENDER KE HTML
 */
const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ProductionSystem />
    </React.StrictMode>
  );
}
