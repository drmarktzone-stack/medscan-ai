import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Trash2, Activity, Stethoscope, Loader2, ImageOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import CaseForm from "@/components/knowledge/CaseForm";
import SearchFilter from "@/components/knowledge/SearchFilter";

const categoryLabels = {
  rhythm: "הפרעות קצב",
  conduction: "הפרעות הולכה",
  ischemic: "איסכמיה / אוטם",
  chamber_abnormality: "הגדלת חדרים / עליות",
  electrolyte: "אלקטרוליטים",
  syndrome: "תסמונות",
  drug_effect: "תרופות",
  other: "אחר",
  benign: "שפיר",
  malignant: "ממאיר",
  precancerous: "טרום-ממאיר",
  inflammatory: "דלקתי",
  infectious: "זיהומי",
  autoimmune: "אוטואימוני",
  pigmentation: "פיגמנטציה",
  vascular: "כלי דם",
};

const ecgCategories = [
  { value: "rhythm", label: "הפרעות קצב" },
  { value: "conduction", label: "הפרעות הולכה" },
  { value: "ischemic", label: "איסכמיה / אוטם" },
  { value: "chamber_abnormality", label: "הגדלת חדרים / עליות" },
  { value: "electrolyte", label: "אלקטרוליטים" },
  { value: "syndrome", label: "תסמונות" },
  { value: "drug_effect", label: "תרופות" },
  { value: "other", label: "אחר" },
];

const skinCategories = [
  { value: "benign", label: "שפיר" },
  { value: "malignant", label: "ממאיר" },
  { value: "precancerous", label: "טרום-ממאיר" },
  { value: "inflammatory", label: "דלקתי" },
  { value: "infectious", label: "זיהומי" },
  { value: "autoimmune", label: "אוטואימוני" },
  { value: "pigmentation", label: "פיגמנטציה" },
  { value: "vascular", label: "כלי דם" },
  { value: "other", label: "אחר" },
];

function filterCases(cases, query, category) {
  let filtered = cases;
  if (category) {
    filtered = filtered.filter((c) => c.category === category);
  }
  if (query) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter((c) =>
      [c.title, c.diagnosis, c.key_features, c.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }
  return filtered;
}

export default function KnowledgeBase() {
  const [tab, setTab] = useState("ecg");
  const [ecgCases, setEcgCases] = useState([]);
  const [skinCases, setSkinCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ecg, skin] = await Promise.all([
        base44.entities.ECGCase.list("-created_date", 100),
        base44.entities.SkinCase.list("-created_date", 100),
      ]);
      setEcgCases(ecg);
      setSkinCases(skin);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setQuery("");
    setCategory("");
  };

  const filteredEcgCases = filterCases(ecgCases, query, category);
  const filteredSkinCases = filterCases(skinCases, query, category);
  const activeCategories = tab === "ecg" ? ecgCategories : skinCategories;

  const handleDelete = async (type, id) => {
    const entityName = type === "ecg" ? "ECGCase" : "SkinCase";
    await base44.entities[entityName].delete(id);
    loadData();
  };

  const renderCase = (c, type) => (
    <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
          {c.image_url ? (
            <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
          ) : (
            <ImageOff className="w-5 h-5 text-muted-foreground/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground truncate">{c.title}</h3>
            <button
              onClick={() => handleDelete(type, c.id)}
              className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-primary font-medium mt-0.5">{c.diagnosis}</p>
          {c.category && (
            <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-muted-foreground">
              {categoryLabels[c.category] || c.category}
            </span>
          )}
          {c.key_features && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">{c.key_features}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-base">מאגר הידע הרפואי</h1>
          </div>
          <Button
            onClick={() => setFormOpen(true)}
            size="sm"
            className="rounded-lg text-xs"
          >
            <Plus className="w-4 h-4 ml-1" />
            הוסף מקרה
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 w-full rounded-xl">
            <TabsTrigger value="ecg" className="rounded-xl">
              <Activity className="w-4 h-4 ml-1.5" />
              ECG ({ecgCases.length})
            </TabsTrigger>
            <TabsTrigger value="skin" className="rounded-xl">
              <Stethoscope className="w-4 h-4 ml-1.5" />
              עור ({skinCases.length})
            </TabsTrigger>
          </TabsList>

          {!loading && (ecgCases.length > 0 || skinCases.length > 0) && (
            <div className="mt-4">
              <SearchFilter
                query={query}
                onQueryChange={setQuery}
                category={category}
                onCategoryChange={setCategory}
                categories={activeCategories}
              />
            </div>
          )}

          <TabsContent value="ecg" className="mt-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : ecgCases.length === 0 ? (
              <EmptyState />
            ) : filteredEcgCases.length === 0 ? (
              <NoResults />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">מציג {filteredEcgCases.length} מתוך {ecgCases.length} מקרים</p>
                {filteredEcgCases.map((c) => renderCase(c, "ecg"))}
              </>
            )}
          </TabsContent>

          <TabsContent value="skin" className="mt-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : skinCases.length === 0 ? (
              <EmptyState />
            ) : filteredSkinCases.length === 0 ? (
              <NoResults />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">מציג {filteredSkinCases.length} מתוך {skinCases.length} מקרים</p>
                {filteredSkinCases.map((c) => renderCase(c, "skin"))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CaseForm
        type={tab}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={loadData}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-sm text-muted-foreground">אין מקרים במאגר עדיין</p>
      <p className="text-xs text-muted-foreground/60 mt-1">הוסף מקרה ראשון כדי לשפר את דיוק הניתוח</p>
    </div>
  );
}

function NoResults() {
  return (
    <div className="text-center py-16">
      <p className="text-sm text-muted-foreground">לא נמצאו תוצאות תואמות</p>
      <p className="text-xs text-muted-foreground/60 mt-1">נסה לשנות את החיפוש או הסינון</p>
    </div>
  );
}