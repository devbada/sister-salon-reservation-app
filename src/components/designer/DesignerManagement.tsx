import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, User, Award, Loader2, Users } from 'lucide-react';
import { designerApi } from '../../lib/tauri';
import type { Designer } from '../../types';

export function DesignerManagement() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', specialty: '' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadDesigners();
  }, []);

  const loadDesigners = async () => {
    try {
      const data = await designerApi.getAll();
      setDesigners(data);
    } catch (error) {
      console.error('Failed to load designers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await designerApi.update(editingId, formData);
      } else {
        await designerApi.create({ ...formData, isActive: true });
      }
      setFormData({ name: '', specialty: '' });
      setEditingId(null);
      setShowForm(false);
      loadDesigners();
    } catch (error) {
      console.error('Failed to save designer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (designer: Designer) => {
    setEditingId(designer.id);
    setFormData({ name: designer.name, specialty: designer.specialty || '' });
    setShowForm(true);
  };

  const handleToggleActive = async (designer: Designer) => {
    try {
      await designerApi.update(designer.id, { isActive: !designer.isActive });
      loadDesigners();
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await designerApi.delete(id);
      loadDesigners();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', specialty: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="heading-2">디자이너 관리</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">새 디자이너</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="glass-card animate-scale-in">
              <h2 className="heading-3 mb-6">
                {editingId ? '디자이너 수정' : '새 디자이너 등록'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="디자이너 이름"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    전문분야
                  </label>
                  <input
                    type="text"
                    placeholder="예: 커트, 염색, 펌"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    editingId ? '수정' : '등록'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designer List */}
      {designers.length === 0 ? (
        <div className="glass-card empty-state">
          <Users className="empty-state-icon" />
          <h3 className="heading-3 mb-2">등록된 디자이너가 없습니다</h3>
          <p className="text-caption mb-4">새 디자이너를 등록해 주세요.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            디자이너 등록
          </button>
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {designers.map((d, index) => (
              <div
                key={d.id}
                className={`flex items-center justify-between p-4 animate-fade-in ${
                  !d.isActive ? 'opacity-60' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    d.isActive
                      ? 'bg-gradient-to-br from-primary-400 to-secondary-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <User className="w-5 h-5 text-white" />
                  </div>

                  {/* Info */}
                  <div>
                    <p className="font-medium">{d.name}</p>
                    {d.specialty && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {d.specialty}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(d)}
                    className={`badge cursor-pointer ${
                      d.isActive ? 'badge-active' : 'badge-inactive'
                    }`}
                  >
                    {d.isActive ? '활성' : '비활성'}
                  </button>
                  <button
                    onClick={() => handleEdit(d)}
                    className="btn btn-ghost btn-sm btn-icon"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="btn btn-ghost btn-sm btn-icon text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
