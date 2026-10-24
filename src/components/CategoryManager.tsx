import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  User,
  Briefcase,
  CreditCard,
  CalendarCheck,
  Repeat,
  Bookmark,
  Heart,
  Home,
  GraduationCap,
  Plane,
  Dumbbell,
  Coffee,
  ShoppingCart,
  Music,
  Book,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { Category, Reminder, UserPlan } from '../types/reminder';

interface CategoryManagerProps {
  categories: Category[];
  reminders: Reminder[];
  userPlan: UserPlan;
  onOpenPremium: () => void;
  onSaveCustomCategory: (category: Category) => void;
  onDeleteCustomCategory: (categoryId: string) => void;
  onSelectCategoryFilter: (categoryId: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Heart', icon: Heart },
  { name: 'Home', icon: Home },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Plane', icon: Plane },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Coffee', icon: Coffee },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Music', icon: Music },
  { name: 'Book', icon: Book },
  { name: 'Wrench', icon: Wrench },
  { name: 'Tag', icon: Tag },
];

const CURATED_COLORS = [
  { name: 'Teal', color: 'bg-teal-500', bgLight: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300', textColor: 'text-teal-600 dark:text-teal-400' },
  { name: 'Indigo', color: 'bg-indigo-500', bgLight: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300', textColor: 'text-indigo-600 dark:text-indigo-400' },
  { name: 'Rose', color: 'bg-rose-500', bgLight: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300', textColor: 'text-rose-600 dark:text-rose-400' },
  { name: 'Amber', color: 'bg-amber-500', bgLight: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300', textColor: 'text-amber-600 dark:text-amber-400' },
  { name: 'Cyan', color: 'bg-cyan-500', bgLight: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300', textColor: 'text-cyan-600 dark:text-cyan-400' },
  { name: 'Violet', color: 'bg-violet-500', bgLight: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300', textColor: 'text-violet-600 dark:text-violet-400' },
  { name: 'Orange', color: 'bg-orange-500', bgLight: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300', textColor: 'text-orange-600 dark:text-orange-400' },
  { name: 'Slate', color: 'bg-slate-600', bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', textColor: 'text-slate-600 dark:text-slate-400' },
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  reminders,
  userPlan,
  onOpenPremium,
  onSaveCustomCategory,
  onDeleteCustomCategory,
  onSelectCategoryFilter,
}) => {
  const isPremium = userPlan.tier === 'PREMIUM';
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CURATED_COLORS[0]);
  const [selectedIconName, setSelectedIconName] = useState('Tag');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const standardCats = categories.filter((c) => !c.isCustom);
  const customCats = categories.filter((c) => c.isCustom);

  const handleOpenCreate = () => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }
    setCatName('');
    setSelectedColor(CURATED_COLORS[0]);
    setSelectedIconName('Tag');
    setEditingCategory(null);
    setIsCreating(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setCatName(cat.name);
    const foundColor = CURATED_COLORS.find((c) => c.color === cat.color) || CURATED_COLORS[0];
    setSelectedColor(foundColor);
    setSelectedIconName(cat.iconName || 'Tag');
    setEditingCategory(cat);
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const id = editingCategory ? editingCategory.id : `custom_${Date.now()}`;
    const newCategory: Category = {
      id,
      name: catName.trim(),
      color: selectedColor.color,
      bgLight: selectedColor.bgLight,
      textColor: selectedColor.textColor,
      iconName: selectedIconName,
      isCustom: true,
      description: 'Custom category created by you.',
    };

    onSaveCustomCategory(newCategory);
    setIsCreating(false);
    setEditingCategory(null);
  };

  const renderIcon = (name: string, className = 'w-4 h-4') => {
    switch (name) {
      case 'User': return <User className={className} />;
      case 'Briefcase': return <Briefcase className={className} />;
      case 'CreditCard': return <CreditCard className={className} />;
      case 'CalendarCheck': return <CalendarCheck className={className} />;
      case 'Repeat': return <Repeat className={className} />;
      case 'Bookmark': return <Bookmark className={className} />;
      case 'Heart': return <Heart className={className} />;
      case 'Home': return <Home className={className} />;
      case 'GraduationCap': return <GraduationCap className={className} />;
      case 'Plane': return <Plane className={className} />;
      case 'Dumbbell': return <Dumbbell className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'ShoppingCart': return <ShoppingCart className={className} />;
      case 'Music': return <Music className={className} />;
      case 'Book': return <Book className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      default: return <Tag className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Reminder Categories
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize personal tasks, bills, appointments, and custom groups.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
        >
          {isPremium ? (
            <>
              <Plus className="w-4 h-4" />
              <span>Create Custom Category</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Create Custom Category (Premium)</span>
            </>
          )}
        </button>
      </div>

      {/* Free Plan Core Categories Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Standard Core Categories (Included Free)
          </span>
          <span className="text-xs text-slate-400">6 categories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {standardCats.map((cat) => {
            const count = reminders.filter((r) => r.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategoryFilter(cat.id)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/50 cursor-pointer shadow-xs transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${cat.bgLight} flex items-center justify-center`}>
                      {renderIcon(cat.iconName, 'w-3.5 h-3.5')}
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {count} reminder{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Custom Categories Section */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Custom Categories
            </span>
            <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              Premium Feature
            </span>
          </div>

          <span className="text-xs text-slate-400">{customCats.length} custom</span>
        </div>

        {customCats.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <Tag className="w-6 h-6 text-slate-400 mx-auto mb-1.5 opacity-60" />
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
              No custom categories created yet
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
              Premium members can create custom categories for fitness, hobbies, pets, side projects, travel, and more.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              {isPremium ? 'Add Custom Category' : 'Upgrade to Add Custom Categories'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customCats.map((cat) => {
              const count = reminders.filter((r) => r.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      onClick={() => onSelectCategoryFilter(cat.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className={`w-7 h-7 rounded-lg ${cat.bgLight} flex items-center justify-center`}>
                        {renderIcon(cat.iconName, 'w-3.5 h-3.5')}
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(cat.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>{count} reminder{count !== 1 ? 's' : ''}</span>
                    <button
                      onClick={() => onSelectCategoryFilter(cat.id)}
                      className="text-teal-600 dark:text-teal-400 hover:underline text-[11px]"
                    >
                      View Reminders &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Custom Category */}
      {deleteConfirmId && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-xs text-rose-900 dark:text-rose-200">
              Delete this custom category? Your reminders will be safely kept and reassigned to "Other".
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDeleteCustomCategory(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Custom Category Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Custom Category' : 'Create Custom Category'}
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Fitness, Hobbies, Travel"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Category Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {CURATED_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full ${c.color} flex items-center justify-center text-white transition-transform ${
                        selectedColor.name === c.name ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {selectedColor.name === c.name && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Category Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const isSelected = selectedIconName === item.name;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIconName(item.name)}
                        className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        title={item.name}
                      >
                        <IconComponent className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
