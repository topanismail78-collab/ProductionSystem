import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// MASUKKAN URL DAN KEY KAMU DI SINI
const SUPABASE_URL = "https://npkgrgiypzkwytmtxgpk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wa2dyZ2l5cHprd3l0bXR4Z3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDcwMzgsImV4cCI6MjA4Nzg4MzAzOH0.C44YWp5Lclm2F4BkD1zM6W1aiX8Mgtc6Nq5eWniZDY8";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function ProductionSystem() {
  const [language, setLanguage] = useState("id");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", color: "", shift: "Siang", product: "", quantity: "" });

  const text: any = {
    id: { title: "SISTEM PRODUKSI", date: "Tanggal", time: "Waktu", color: "Warna", shift: "Shift", product: "Produk", qty: "Jumlah", save: "Simpan", export: "Excel", action: "Aksi", delete: "Hapus", day: "Siang", night: "Malam" },
    cn: { title: "生产系统", date: "日期", time: "时间", color: "颜色", shift: "班次", product: "产品", qty: "数量", save: "保存", export: "Excel", action: "操作", delete: "删除", day: "白班", night: "夜班" }
  };
  const t = text[language];

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("production_data").select("*").order("id", { ascending: false });
    if (error) {
      console.error(error);
      alert("Gagal ambil data: " + error.message);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.date || !form.product) return alert("Tanggal dan Produk harus diisi!");
    
    const currentTime = new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });

    const { error } = await supabase.from("production_data").insert([{
      date: form.date,
      time: currentTime,
      color: form.color,
      shift: form.shift,
      product: form.product,
      quantity: Number(form.quantity)
    }]);

    if (error) {
      alert("Gagal Simpan: " + error.message);
    } else {
      setForm({ ...form, color: "", product: "", quantity: "" });
      fetchData();
    }
  };

  const handleDelete = async (id: any) => {
    const { error } = await supabase.from("production_data").delete().eq("id", id);
    if (!error) fetchData();
  };

  return (
    <div className="p-4 max-w-5xl mx-auto font-sans">
      <div className="flex justify-between mb-4 bg-white p-4 shadow rounded-lg">
        <h1 className="font-bold text-blue-800">{t.title}</h1>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border rounded">
          <option value="id">Indonesia</option>
          <option value="cn">中文</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6 bg-gray-50 p-4 rounded-lg border">
        <input type="date" className="border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        <input placeholder={t.color} className="border p-2 rounded" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
        <select className="border p-2 rounded" value={form.shift} onChange={e => setForm({...form, shift: e.target.value})}>
          <option value="Siang">Siang / 白班</option>
          <option value="Malam">Malam / 夜班</option>
        </select>
        <input placeholder={t.product} className="border p-2 rounded" value={form.product} onChange={e => setForm({...form, product: e.target.value})} />
        <input type="number" placeholder={t.qty} className="border p-2 rounded" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
        <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">{t.save}</button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="p-3">{t.date}</th>
              <th className="p-3">{t.time}</th>
              <th className="p-3">{t.color}</th>
              <th className="p-3">{t.shift}</th>
              <th className="p-3">{t.product}</th>
              <th className="p-3">{t.qty}</th>
              <th className="p-3 text-center">{t.action}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-10 text-center text-gray-400">Menghubungkan ke Database Cloud...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-gray-400 italic">Belum ada data di Cloud.</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{r.date}</td>
                <td className="p-3 text-gray-400 font-mono text-xs">{r.time}</td>
                <td className="p-3">{r.color}</td>
                <td className="p-3">{r.shift === "Siang" ? t.day : t.night}</td>
                <td className="p-3 font-medium">{r.product}</td>
                <td className="p-3 font-bold text-blue-600">{r.quantity}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 font-bold hover:underline">{t.delete}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<ProductionSystem />);
