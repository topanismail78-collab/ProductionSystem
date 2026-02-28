import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

/** 1. KONFIGURASI SUPABASE (URL SUDAH DIPERBAIKI) **/
const SUPABASE_URL = "https://npkgrgiypzkwytmtxgpk.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wa2dyZ2l5cHprd3l0bXR4Z3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDcwMzgsImV4cCI6MjA4Nzg4MzAzOH0.C44YWp5Lclm2F4BkD1zM6W1aiX8Mgtc6Nq5eWniZDY8";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** 2. UI COMPONENTS EKSLUSIF **/
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "default", className = "" }: any) => {
  const v: any = { 
    default: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5",
    success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5",
    danger: "text-red-500 hover:bg-red-50 hover:text-red-700"
  };
  return (
    <button onClick={onClick} className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 active:scale-95 shadow-md ${v[variant]} ${className}`}>
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
    id: { title: "PRODUCTION HUB", add: "Input Produksi", date: "Tanggal", time: "Waktu", color: "Warna", shift: "Shift", product: "Produk", qty: "Qty", save: "Simpan Data", export: "Export Excel", action: "Aksi", delete: "Hapus", total: "TOTAL", day: "Siang", night: "Malam", loading: "Memuat data cloud..." },
    cn: { title: "生产中心", add: "生产输入", date: "日期", time: "时间", color: "颜色", shift: "班次", product: "产品", qty: "数量", save: "保存数据", export: "导出 Excel", action: "操作", delete: "删除", total: "总计", day: "白班", night: "夜班", loading: "正在加载..." }
  };
  const t = text[language as keyof typeof text];

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("production_data").select("*").order("created_at", { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    localStorage.setItem("app_lang", language);
  }, [language]);

  const handleSubmit = async () => {
    if (!form.date || !form.product || !form.quantity) return alert("Mohon lengkapi semua field!");
    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    const { error } = await supabase.from("production_data").insert([{ ...form, time: currentTime, quantity: parseInt(form.quantity) }]);
    if (error) alert("Error: " + error.message);
    else { setForm({ ...form, color: "", product: "", quantity: "" }); fetchData(); }
  };

  const handleDelete = async (id: any) => {
    if(confirm("Hapus data ini?")) {
      const { error } = await supabase.from("production_data").delete().eq("id", id);
      if (!error) fetchData();
    }
  };

  const handleExport = () => {
    const filtered = records.filter(r => filterDate ? r.date === filterDate : true);
    const totalQty = filtered.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const dataExcel = filtered.map(r => ({
      [t.date]: r.date, [t.time]: r.time, [t.color]: r.color, [t.shift]: r.shift === "Siang" ? t.day : t.night, [t.product]: r.product, [t.qty]: r.quantity
    }));
    dataExcel.push({ [t.product]: t.total, [t.qty]: totalQty });
    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Production_Report_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
      {/* HEADER AREA */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)} 
            className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="id">🇮🇩 ID</option>
            <option value="cn">🇨🇳 CN</option>
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        
        {/* INPUT SECTION */}
        <Card className="p-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{t.add}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1">{t.date}</label>
              <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1">{t.color}</label>
              <input placeholder="Ex: Merah" value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1">{t.shift}</label>
              <select value={form.shift} onChange={(e) => setForm({...form, shift: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="Siang">{t.day}</option>
                <option value="Malam">{t.night}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1">{t.product}</label>
              <input placeholder="Nama Produk" value={form.product} onChange={(e) => setForm({...form, product: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 ml-1">{t.qty}</label>
              <input type="number" placeholder="0" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSubmit} className="w-full">{t.save}</Button>
            </div>
          </div>
        </Card>

        {/* DATA TABLE SECTION */}
        <Card>
          <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
              <h3 className="font-bold text-slate-700">Data Logs</h3>
            </div>
            <div className="flex items-center gap-3">
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" />
              <Button onClick={handleExport} variant="success" className="text-xs">{t.export}</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 text-[11px] uppercase tracking-[0.15em] bg-white">
                  <th className="px-8 py-5 font-bold">{t.date}</th>
                  <th className="px-6 py-5 font-bold">{t.time}</th>
                  <th className="px-6 py-5 font-bold">{t.shift}</th>
                  <th className="px-6 py-5 font-bold">{t.product}</th>
                  <th className="px-6 py-5 font-bold text-right">{t.qty}</th>
                  <th className="px-8 py-5 font-bold text-center">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 animate-pulse font-medium">{t.loading}</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-300 italic">No records found.</td></tr>
                ) : records.filter(r => filterDate ? r.date === filterDate : true).map((r) => (
                  <tr key={r.id} className="group hover:bg-blue-50/40 transition-all">
                    <td className="px-8 py-4 font-semibold text-slate-600">{r.date}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">{r.time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.shift === "Siang" ? "bg-orange-100 text-orange-600" : "bg-indigo-100 text-indigo-600"
                      }`}>
                        {r.shift === "Siang" ? t.day : t.night}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {r.product} <span className="block text-[10px] font-normal text-slate-400">{r.color}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-black text-blue-600">{r.quantity}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <Button onClick={() => handleDelete(r.id)} variant="danger" className="text-xs font-bold py-1 px-3 shadow-none bg-transparent">
                        {t.delete}
                      </Button>
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
