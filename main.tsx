import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as XLSX from "xlsx";

/** 1. KOMPONEN UI INTERNAL **/
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "default", className = "" }: any) => {
  const variants: any = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-green-600 text-white hover:bg-green-700",
  };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = (props: any) => (
  <input {...props} className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white ${props.className}`} />
);

/** 2. APLIKASI UTAMA **/
function ProductionSystem() {
  const [language, setLanguage] = useState(() => localStorage.getItem("app_lang") || "id");
  const [records, setRecords] = useState<any[]>(() => {
    const saved = localStorage.getItem("prod_data");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [form, setForm] = useState({ date: "", color: "", shift: "Siang", product: "", quantity: "" });
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    localStorage.setItem("app_lang", language);
    localStorage.setItem("prod_data", JSON.stringify(records));
  }, [language, records]);

  const text = {
    id: { title: "SISTEM PRODUKSI", add: "Tambah Data", date: "Tanggal", time: "Waktu", color: "Warna", shift: "Shift", product: "Produk", qty: "Jumlah", save: "Simpan", export: "Ekspor Excel", delete: "Hapus", total: "TOTAL" },
    cn: { title: "生产系统", add: "添加数据", date: "日期", time: "时间", color: "颜色", shift: "班次", product: "产品", qty: "数量", save: "保存", export: "导出 Excel", delete: "删除", total: "总计" },
  };

  const t = text[language as keyof typeof text];

  const handleSubmit = () => {
    if (!form.date || !form.product || !form.quantity) return alert("Isi data dengan lengkap!");
    
    // Mengambil waktu saat ini secara otomatis
    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const newRec = { 
      ...form, 
      id: Date.now(), 
      time: currentTime, // Simpan waktu otomatis
      quantity: parseInt(form.quantity) 
    };
    
    setRecords([newRec, ...records]);
    setForm({ ...form, color: "", product: "", quantity: "" });
  };

  const handleExport = () => {
    // Filter data berdasarkan tanggal jika ada
    const filteredRecords = records.filter(r => filterDate ? r.date === filterDate : true);
    
    // Hitung Total
    const totalQty = filteredRecords.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Map data untuk Excel
    const dataForExcel = filteredRecords.map(r => ({
      [t.date]: r.date,
      [t.time]: r.time, // Waktu masuk ke Excel
      [t.color]: r.color,
      [t.shift]: r.shift,
      [t.product]: r.product,
      [t.qty]: r.quantity
    }));

    // Tambahkan baris TOTAL di paling bawah
    dataForExcel.push({
      [t.date]: "",
      [t.time]: "",
      [t.color]: "",
      [t.shift]: "",
      [t.product]: t.total,
      [t.qty]: totalQty
    });

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Produksi_${filterDate || "Semua"}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-blue-900">{t.title}</h1>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border rounded-md px-2 py-1">
          <option value="id">ID (Indonesia)</option>
          <option value="cn">CN (中文)</option>
        </select>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Input type="date" value={form.date} onChange={(e:any) => setForm({...form, date: e.target.value})} />
          <Input placeholder={t.color} value={form.color} onChange={(e:any) => setForm({...form, color: e.target.value})} />
          <select value={form.shift} onChange={(e) => setForm({...form, shift: e.target.value})} className="border rounded-lg px-3 py-2 text-sm">
            <option value="Siang">Siang / 白班</option>
            <option value="Malam">Malam / 夜班</option>
          </select>
          <Input placeholder={t.product} value={form.product} onChange={(e:any) => setForm({...form, product: e.target.value})} />
          <Input type="number" placeholder={t.qty} value={form.quantity} onChange={(e:any) => setForm({...form, quantity: e.target.value})} />
          <Button onClick={handleSubmit}>{t.save}</Button>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <Input type="date" className="!w-40" value={filterDate} onChange={(e:any) => setFilterDate(e.target.value)} />
          <Button onClick={handleExport} variant="success" className="text-xs">{t.export}</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4">{t.date}</th>
                <th className="p-4">{t.time}</th>
                <th className="p-4">{t.color}</th>
                <th className="p-4">{t.product}</th>
                <th className="p-4">{t.qty}</th>
                <th className="p-4 text-center">{t.delete}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.filter(r => filterDate ? r.date === filterDate : true).map(r => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4">{r.date}</td>
                  <td className="p-4 text-gray-500 font-mono">{r.time}</td>
                  <td className="p-4">{r.color}</td>
                  <td className="p-4 font-medium">{r.product}</td>
                  <td className="p-4 font-bold text-blue-600">{r.quantity}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => setRecords(records.filter(i => i.id !== r.id))} className="text-red-400 font-bold">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<React.StrictMode><ProductionSystem /></React.StrictMode>);
