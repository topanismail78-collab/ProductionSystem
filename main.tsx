import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

/** KONFIGURASI SUPABASE - GANTI DISINI **/
const SUPABASE_URL = "https://npkgrgiypzkwytmtxgpk.supabase.co/production_data";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wa2dyZ2l5cHprd3l0bXR4Z3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDcwMzgsImV4cCI6MjA4Nzg4MzAzOH0.C44YWp5Lclm2F4BkD1zM6W1aiX8Mgtc6Nq5eWniZDY8";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** UI COMPONENTS **/
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "default", className = "" }: any) => {
  const v: any = { default: "bg-blue-600 text-white", success: "bg-green-600 text-white" };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg font-medium active:scale-95 transition-all ${v[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = (props: any) => (
  <input {...props} className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white ${props.className}`} />
);

/** APP UTAMA **/
function ProductionSystem() {
  const [language, setLanguage] = useState(() => localStorage.getItem("app_lang") || "id");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", color: "", shift: "Siang", product: "", quantity: "" });
  const [filterDate, setFilterDate] = useState("");

  const text = {
    id: { title: "SISTEM PRODUKSI ONLINE", date: "Tanggal", time: "Waktu", color: "Warna", shift: "Shift", product: "Produk", qty: "Jumlah", save: "Simpan", export: "Excel", action: "Aksi", delete: "Hapus", total: "TOTAL", day: "Siang", night: "Malam" },
    cn: { title: "在线生产系统", date: "日期", time: "时间", color: "颜色", shift: "班次", product: "产品", qty: "数量", save: "保存", export: "Excel", action: "操作", delete: "删除", total: "总计", day: "白班", night: "夜班" }
  };
  const t = text[language as keyof typeof text];

  // Ambil Data dari Cloud saat aplikasi dibuka
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("production_data")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    localStorage.setItem("app_lang", language);
  }, [language]);

  // Simpan Data ke Cloud
  const handleSubmit = async () => {
    if (!form.date || !form.product || !form.quantity) return alert("Isi lengkap!");
    
    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    
    const { error } = await supabase.from("production_data").insert([{
      date: form.date,
      time: currentTime,
      color: form.color,
      shift: form.shift,
      product: form.product,
      quantity: parseInt(form.quantity)
    }]);

    if (error) alert("Gagal simpan ke Cloud: " + error.message);
    else {
      setForm({ ...form, color: "", product: "", quantity: "" });
      fetchData(); // Refresh data otomatis
    }
  };

  // Hapus Data dari Cloud
  const handleDelete = async (id: any) => {
    const { error } = await supabase.from("production_data").delete().eq("id", id);
    if (!error) fetchData();
  };

  const handleExport = () => {
    const filtered = records.filter(r => filterDate ? r.date === filterDate : true);
    const totalQty = filtered.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const dataExcel = filtered.map(r => ({
      [t.date]: r.date, [t.time]: r.time, [t.color]: r.color, 
      [t.shift]: r.shift === "Siang" ? t.day : t.night, [t.product]: r.product, [t.qty]: r.quantity
    }));
    dataExcel.push({ [t.product]: t.total, [t.qty]: totalQty });
    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produksi");
    XLSX.writeFile(wb, `Laporan_${filterDate || "Semua"}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h1 className="text-xl font-bold text-blue-900">{t.title}</h1>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border rounded px-2 py-1">
          <option value="id">Indonesia</option>
          <option value="cn">中文</option>
        </select>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Input type="date" value={form.date} onChange={(e:any) => setForm({...form, date: e.target.value})} />
          <Input placeholder={t.color} value={form.color} onChange={(e:any) => setForm({...form, color: e.target.value})} />
          <select value={form.shift} onChange={(e) => setForm({...form, shift: e.target.value})} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="Siang">Siang / 白班</option>
            <option value="Malam">Malam / 夜班</option>
          </select>
          <Input placeholder={t.product} value={form.product} onChange={(e:any) => setForm({...form, product: e.target.value})} />
          <Input type="number" placeholder={t.qty} value={form.quantity} onChange={(e:any) => setForm({...form, quantity: e.target.value})} />
          <Button onClick={handleSubmit}>{t.save}</Button>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <Input type="date" className="!w-40" value={filterDate} onChange={(e:any) => setFilterDate(e.target.value)} />
          <Button onClick={handleExport} variant="success" className="text-xs">{t.export}</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="p-4">{t.date}</th>
                <th className="p-4">{t.time}</th>
                <th className="p-4">{t.color}</th>
                <th className="p-4">{t.product}</th>
                <th className="p-4">{t.qty}</th>
                <th className="p-4 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center">Loading Data...</td></tr>
              ) : records.filter(r => filterDate ? r.date === filterDate : true).map(r => (
                <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4">{r.date}</td>
                  <td className="p-4 text-gray-400 font-mono text-[10px]">{r.time}</td>
                  <td className="p-4">{r.color}</td>
                  <td className="p-4 font-medium">{r.product}</td>
                  <td className="p-4 font-bold text-blue-600">{r.quantity}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(r.id)} className="text-red-500 font-bold">{t.delete}</button>
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
root.render(<ProductionSystem />);
