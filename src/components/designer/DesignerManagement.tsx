import { useState, useEffect } from 'react';
import { designerApi } from '../../lib/tauri';
import type { Designer } from '../../types';

export function DesignerManagement() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', specialty: '' });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">디자이너 관리</h1>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="glass-card">
        <h2 className="text-lg font-medium mb-4">
          {editingId ? '디자이너 수정' : '새 디자이너'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="이름"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
            required
          />
          <input
            type="text"
            placeholder="전문분야"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            className="px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {loading ? '저장 중...' : editingId ? '수정' : '추가'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', specialty: '' });
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 목록 */}
      <div className="glass-card">
        <h2 className="text-lg font-medium mb-4">디자이너 목록</h2>
        <div className="space-y-2">
          {designers.map((d) => (
            <div
              key={d.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                d.isActive ? 'bg-white/10' : 'bg-gray-200/50 dark:bg-gray-800/50'
              }`}
            >
              <div>
                <p className={`font-medium ${!d.isActive && 'text-gray-500'}`}>
                  {d.name}
                </p>
                {d.specialty && (
                  <p className="text-sm text-gray-500">{d.specialty}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(d)}
                  className={`px-2 py-1 text-xs rounded ${
                    d.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {d.isActive ? '활성' : '비활성'}
                </button>
                <button
                  onClick={() => handleEdit(d)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
