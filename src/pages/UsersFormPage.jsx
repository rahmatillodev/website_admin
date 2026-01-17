import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { addMonths, format } from "date-fns";
import userStore from "@/stores/usersStore";
import { toast } from "react-toastify";
import { CiCamera } from "react-icons/ci";
import { LuLoader } from "react-icons/lu";

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { updateUser, getUserById, loading } = userStore();

  // Redirect if no id (edit mode only)
  useEffect(() => {
    if (!id) {
      navigate("/users");
    }
  }, [id, navigate]);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    telegram_username: "",
    subscription_status: "free",
    premium_started_at: format(new Date(), "yyyy-MM-dd"),
    premium_until: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    avatar_image: "",
    avatar_file: "",
    role: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && id) {
      const loadUser = async () => {
        const { data, error } = await getUserById(id);
        if (data) {
          setFormData({ 
            ...data, 
            avatar_image: data.avatar_image,
            
          });
        }
        if (error) {
          toast.error("User not found");
          navigate("/users");
        }
      };
      loadUser();
    }
  }, [id, isEdit, getUserById, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
  
      // Agar status 'premium'ga o'zgarsa va sanalar bo'sh bo'lsa, bugungi sanani qo'yamiz
      if (name === "subscription_status" && value === "premium") {
        const today = new Date();
        newData.premium_started_at = format(today, "yyyy-MM-dd");
        newData.premium_until = format(addMonths(today, 1), "yyyy-MM-dd");
      }
  
      return newData;
    });
  
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        avatar_file: file,
        avatar_image: URL.createObjectURL(file),
      });
    }
  };

  const handlePremiumPreset = (months) => {
    setFormData({
      ...formData,
      premium_until: format(addMonths(new Date(), months), "yyyy-MM-dd"),
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = "To'liq ism talab qilinadi.";
    if (!formData.email.trim()) errs.email = "Email talab qilinadi.";
    if (!formData.role.trim()) errs.role = "Rol talab qilinadi.";

    if (formData.subscription_status === "premium") {
      if (!formData.premium_started_at) errs.premium_started_at = "Boshlanish sanasi talab qilinadi.";
      if (!formData.premium_until) errs.premium_until = "Tugash sanasi talab qilinadi.";
      if (formData.premium_started_at > formData.premium_until) errs.premium_started_at = "Boshlanish sanasi tugash sanasidan katta bo'lishi mumkin emas.";
    }


    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);

      // Output errors using react-toastify
      Object.values(errs).forEach(msg => {
        toast.error(msg);
      });

      return;
    }

    const result = await updateUser(id, formData);

    if (result.success) {
      navigate("/users");
    } else if (result.error && !result.error.message?.includes('Rasm')) {
      // Show error only if it's not already shown by the store
      toast.error(result.error.message || "Xatolik yuz berdi");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-2xl font-bold">
          Foydalanuvchini tahrirlash
        </h1>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-primary text-white px-8"
        >
          {loading ? <LuLoader className="animate-spin mr-2" /> : <Save className="mr-2 size-4" />}
          Yangilash
        </Button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Avatar Upload */}
        <Card className="border-none shadow-sm bg-slate-50/50">
          <CardContent className="flex flex-col items-center py-6">
            <div className="relative group size-32 mb-2">
              <div className="size-full rounded-full bg-white border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
                {formData.avatar_image ? (
                  <img src={formData.avatar_image} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-300">
                    {formData.full_name?.[0] || "?"}
                  </span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition rounded-full">
                <CiCamera className="text-white" size={32} />
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
            </div>
            <p className="text-sm text-slate-500">Rasm yuklash uchun bosing</p>
          </CardContent>
        </Card>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">To'liq ism</label>
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className={`bg-white border rounded-xl h-12 ${errors.full_name ? 'border-red-500' : ''}`}
              placeholder="Eshmatov Toshmat"
            />
            {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`bg-white border rounded-xl h-12 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="example@mail.com"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Telefon</label>
            <Input
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className="bg-white border rounded-xl h-12"
              placeholder="+998 90 123 45 67"
            />
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Rol</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="flex h-12 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
          </div>

          

         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Telegram username</label>
            <Input
              name="telegram_username"
              value={formData.telegram_username}
              onChange={handleInputChange}
              placeholder="@username"
              className="bg-white border rounded-xl h-12"
            />
          </div>
        </div>

        <hr className="my-6" />

        {/* Subscription Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">Obuna holati</label>
            <select
              name="subscription_status"
              value={formData.subscription_status}
              onChange={handleInputChange}
              className="flex h-12 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              {/* <option value="pending">Pending Payment</option> */}
            </select>
          </div>

          {formData.subscription_status === "premium" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <span className="font-bold text-blue-800 text-sm">Premium muddatini tanlang</span>
              <div className="flex gap-2">
                {[1, 6, 12].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePremiumPreset(m)}
                    className="bg-white hover:bg-blue-100"
                  >
                    +{m} Oy
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-blue-600 font-bold">Boshlanish</label>
                  <Input
                    name="premium_started_at"
                    type="date"
                    min="2026-01-01"
                    max="3000-12-31"
                    value={formData.premium_started_at}
                    onChange={handleInputChange}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-blue-600 font-bold">Tugash</label>
                  <Input
                    name="premium_until"
                    type="date"
                    max="3000-12-31"
                    min="2026-01-01"
                    value={formData.premium_until}
                    onChange={handleInputChange}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}