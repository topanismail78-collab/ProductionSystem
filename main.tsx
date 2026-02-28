import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

/** 1. CONFIG **/
const SUPABASE_URL = "https://npkgrgiypzkwytmtxgpk.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wa2dyZ2l5cHprd3l0bXR4Z3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDcwMzgsImV4cCI6MjA4Nzg4MzAzOH0.C44YWp5Lclm2F4BkD1zM6W1aiX8Mgtc6Nq5eWniZDY8";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** 2. STYLED COMPONENTS (LOCKED DESIGN) **/
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "default", className = "" }: any) => {
  const v: any = { 
    default: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-100 hover:shadow-blue-200 hover:-translate-y-0.5",
    success: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-100 hover:shadow-emerald-200 hover:-translate-y-0.5",
    danger: "text-red-500 hover:bg-red-50 hover:text-red-700 font-bold"
  };
  return (
    <button onClick={onClick} className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 active:scale-95 shadow-lg ${v[variant]} ${className}`}>
      {children}
    </button>
  );
};

/** 3. APP UTAMA **/
function ProductionSystem() {
  const [language, setLanguage] = useState(() => localStorage.getItem("app_lang") || "id");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], color: "", shift: "Siang", product: "", quantity: "" });
  const [filterDate, setFilterDate] = useState("");

  const text = {
    id: { 
      title: "PRODUCTION HUB", subtitle: "Terhubung Cloud", add: "Input Produksi", logTitle: "Log Produksi",
      date: "Tanggal", time: "Waktu", color: "Warna", shift: "Shift", product: "Produk", qty: "Qty", 
      save: "Simpan Data", export: "Export Excel", action: "Aksi", delete: "Hapus", 
      total: "TOTAL", day: "Siang", night: "Malam", loading: "Sinkronisasi Cloud...", empty: "Tidak ada data di Cloud.",
      confirmDelete: "Hapus data ini?", alertIncomplete: "Data tidak lengkap!"
    },
    cn: { 
      title: "生产中心", subtitle: "已连接云端", add: "生产输入", logTitle: "生产日志",
      date: "日期", time: "时间", color: "颜色", shift: "班次", product: "产品", qty: "数量", 
      save: "保存数据", export: "导出 Excel", action: "操作", delete: "删除", 
      total: "总计", day: "白班", night: "夜班", loading: "同步中...", empty: "云端没有数据。",
      confirmDelete: "删除此数据?", alertIncomplete: "数据不完整!"
    }
  };
  const t = text[language as keyof typeof text];

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("production_data").select("*").order("id", { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    localStorage.setItem("app_lang", language);
  }, [language]);

  const handleSubmit = async () => {
    if (!form.date || !form.product || !form.quantity) return alert(t.alertIncomplete);
    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    const { error } = await supabase.from("production_data").insert([{ ...form, time: currentTime, quantity: parseInt(form.quantity) }]);
    if (error) alert(error.message);
    else { setForm({ ...form, color: "", product: "", quantity: "" }); fetchData(); }
  };

  const handleDelete = async (id: any) => {
    if(confirm(t.confirmDelete)) {
      const { error } = await supabase.from("production_data").delete().eq("id", id);
      if (!error) fetchData();
    }
  };

  /** PERBAIKAN FILTER EXPORT **/
  const handleExport = () => {
    // 1. Filter data berdasarkan filterDate yang sedang aktif di UI
    const filteredData = records.filter(r => filterDate ? r.date === filterDate : true);
    
    if (filteredData.length === 0) return alert("Tidak ada data untuk tanggal ini!");

    // 2. Hitung total qty dari data yang sudah difilter
    const totalQty = filteredData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    
    // 3. Susun format Excel
    const dataExcel = filteredData.map(r => ({
      [t.date]: r.date, 
      [t.time]: r.time, 
      [t.color]: r.color, 
      [t.shift]: r.shift === "Siang" ? t.day : t.night, 
      [t.product]: r.product, 
      [t.qty]: r.quantity
    }));

    // Tambahkan baris TOTAL di paling bawah
    dataExcel.push({ [t.product]: t.total, [t.qty]: totalQty });

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produksi");
    
    // Penamaan file dinamis berdasarkan filter
    const fileName = filterDate ? `Report_${filterDate}.xlsx` : `Report_Semua_Data.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-12 font-sans text-slate-800 antialiased">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
              <span className="text-white font-black text-2xl italic">B</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">{t.title}</h1>
              <p className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)} 
            className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="id">🇮🇩 ID</option>
            <option value="cn">🇨🇳 CN</option>
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10 space-y-10">
        
        {/* INPUT FORM */}
        <Card className="p-8 border-l-8 border-l-blue-600">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span> {t.add}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 ml-1">{t.date}</label>
              <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 ml-1">{t.color}</label>
              <input placeholder="..." value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 ml-1">{t.shift}</label>
              <select value={form.shift} onChange={(e) => setForm({...form, shift: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-bold">
                <option value="Siang">{t.day}</option>
                <option value="Malam">{t.night}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 ml-1">{t.product}</label>
              <input placeholder="..." value={form.product} onChange={(e) => setForm({...form, product: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 ml-1">{t.qty}</label>
              <input type="number" placeholder="0" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-blue-50/50 outline-none transition-all font-black text-blue-700" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSubmit} className="w-full h-[52px]">{t.save}</Button>
            </div>
          </div>
        </Card>

        {/* LOGS TABLE */}
        <Card>
          <div className="px-8 py-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-6 bg-slate-50/40">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-blue-600 rounded-full"></div>
              <h3 className="font-black text-slate-800 tracking-tight text-lg">{t.logTitle}</h3>
            </div>
            <div className="flex items-center gap-4">
              {/* FILTER TANGGAL DI UI */}
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-50/50 shadow-sm" />
              <Button onClick={handleExport} variant="success" className="text-xs">{t.export}</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] bg-white border-b border-slate-50">
                  <th className="px-8 py-6">{t.date}</th>
                  <th className="px-6 py-6">{t.time}</th>
                  <th className="px-6 py-6">{t.shift}</th>
                  <th className="px-6 py-6">{t.product}</th>
                  <th className="px-6 py-6 text-right">{t.qty}</th>
                  <th className="px-8 py-6 text-center w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">{t.loading}</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-24 text-center text-slate-300 italic font-medium">{t.empty}</td></tr>
                ) : records.filter(r => filterDate ? r.date === filterDate : true).map((r) => (
                  <tr key={r.id} className="group hover:bg-blue-50/40 transition-all duration-300">
                    <td className="px-8 py-5 font-bold text-slate-600">{r.date}</td>
                    <td className="px-6 py-5 text-slate-400 font-mono text-[11px]">{r.time}</td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        r.shift === "Siang" ? "bg-amber-100 text-amber-700 shadow-sm shadow-amber-50" : "bg-slate-800 text-white shadow-lg shadow-slate-100"
                      }`}>
                        {r.shift === "Siang" ? t.day : t.night}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-slate-800 block text-base leading-tight">{r.product}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{r.color}</span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-xl text-blue-700">
                      {r.quantity}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => handleDelete(r.id)} 
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-500 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-500 hover:text-white"
                      >
                        {t.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<ProductionSystem />);
