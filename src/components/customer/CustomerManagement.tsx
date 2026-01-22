import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  Search,
  Loader2,
  Users,
  AlertCircle,
  X,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { customerApi, designerApi } from '../../lib/tauri';
import type { Customer, CreateCustomerInput, CustomerReservation, Designer } from '../../types';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  birthdate: string;
  gender: 'male' | 'female' | 'other' | '';
  preferredDesignerId: string;
  preferredService: string;
  allergies: string;
  notes: string;
}

const initialFormData: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  birthdate: '',
  gender: '',
  preferredDesignerId: '',
  preferredService: '',
  allergies: '',
  notes: '',
};

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [reservationHistory, setReservationHistory] = useState<CustomerReservation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadDesigners();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadDesigners = async () => {
    try {
      const data = await designerApi.getActive();
      setDesigners(data);
    } catch (error) {
      console.error('Failed to load designers:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCustomers();
      return;
    }
    try {
      const data = await customerApi.search(searchQuery);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: CreateCustomerInput = {
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        birthdate: formData.birthdate || undefined,
        gender: formData.gender || undefined,
        preferredDesignerId: formData.preferredDesignerId || undefined,
        preferredService: formData.preferredService || undefined,
        allergies: formData.allergies || undefined,
        notes: formData.notes || undefined,
      };

      if (editingId) {
        await customerApi.update(editingId, data);
      } else {
        await customerApi.create(data);
      }
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      loadCustomers();
    } catch (error) {
      setError(typeof error === 'string' ? error : '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      birthdate: customer.birthdate || '',
      gender: customer.gender || '',
      preferredDesignerId: customer.preferredDesignerId || '',
      preferredService: customer.preferredService || '',
      allergies: customer.allergies || '',
      notes: customer.notes || '',
    });
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) return;
    try {
      await customerApi.delete(id);
      loadCustomers();
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowForm(false);
    setError(null);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingHistory(true);
    try {
      const history = await customerApi.getReservations(customer.id);
      setReservationHistory(history);
    } catch (error) {
      console.error('Failed to load reservation history:', error);
      setReservationHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; class: string } } = {
      pending: { label: '대기', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
      confirmed: { label: '확정', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      completed: { label: '완료', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      cancelled: { label: '취소', class: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
      no_show: { label: '노쇼', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };
    const info = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.class}`}>{info.label}</span>;
  };

  const getGenderLabel = (gender: string | undefined) => {
    if (!gender) return '';
    const map: { [key: string]: string } = {
      male: '남성',
      female: '여성',
      other: '기타',
    };
    return map[gender] || gender;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="heading-2">고객 관리</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">새 고객</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="이름 또는 전화번호로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="glass-card animate-scale-in">
              <h2 className="heading-3 mb-6">{editingId ? '고객 정보 수정' : '새 고객 등록'}</h2>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="고객 이름"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      전화번호
                    </label>
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      이메일
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      생년월일
                    </label>
                    <input
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">성별</label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value as CustomerFormData['gender'] })
                      }
                      className="input"
                    >
                      <option value="">선택 안함</option>
                      <option value="female">여성</option>
                      <option value="male">남성</option>
                      <option value="other">기타</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">선호 디자이너</label>
                    <select
                      value={formData.preferredDesignerId}
                      onChange={(e) => setFormData({ ...formData, preferredDesignerId: e.target.value })}
                      className="input"
                    >
                      <option value="">선택 안함</option>
                      {designers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">선호 서비스</label>
                  <input
                    type="text"
                    placeholder="예: 커트, 염색, 펌"
                    value={formData.preferredService}
                    onChange={(e) => setFormData({ ...formData, preferredService: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">알레르기/주의사항</label>
                  <input
                    type="text"
                    placeholder="예: 두피 민감, 특정 약품 알레르기"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">메모</label>
                  <textarea
                    placeholder="추가 메모..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                  취소
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : editingId ? (
                    '수정'
                  ) : (
                    '등록'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="glass-card animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-3">고객 상세 정보</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="btn btn-ghost btn-sm btn-icon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedCustomer.email && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">이메일</span>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                  )}
                  {selectedCustomer.birthdate && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">생년월일</span>
                      <p className="font-medium">{formatDate(selectedCustomer.birthdate)}</p>
                    </div>
                  )}
                  {selectedCustomer.gender && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">성별</span>
                      <p className="font-medium">{getGenderLabel(selectedCustomer.gender)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">총 방문 횟수</span>
                    <p className="font-medium">{selectedCustomer.totalVisits}회</p>
                  </div>
                  {selectedCustomer.lastVisitDate && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">마지막 방문</span>
                      <p className="font-medium">{formatDate(selectedCustomer.lastVisitDate)}</p>
                    </div>
                  )}
                  {selectedCustomer.preferredService && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">선호 서비스</span>
                      <p className="font-medium">{selectedCustomer.preferredService}</p>
                    </div>
                  )}
                </div>

                {selectedCustomer.allergies && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                      알레르기/주의사항
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{selectedCustomer.allergies}</p>
                  </div>
                )}

                {selectedCustomer.notes && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">메모</span>
                    <p className="text-sm mt-1">{selectedCustomer.notes}</p>
                  </div>
                )}

                {/* Reservation History */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    예약 이력
                  </h4>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : reservationHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      예약 이력이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {reservationHistory.slice(0, 10).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/30 dark:bg-white/5"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {formatDate(r.date)} {r.time}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {r.serviceType || '서비스 미지정'}
                              {r.designerName && ` · ${r.designerName}`}
                            </p>
                          </div>
                          {getStatusBadge(r.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
                <button onClick={() => handleEdit(selectedCustomer)} className="btn btn-secondary">
                  <Pencil className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedCustomer.id);
                    setSelectedCustomer(null);
                  }}
                  className="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="glass-card empty-state">
          <Users className="empty-state-icon" />
          <h3 className="heading-3 mb-2">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
          </h3>
          <p className="text-caption mb-4">
            {searchQuery ? '다른 검색어를 입력해 보세요.' : '새 고객을 등록해 주세요.'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              고객 등록
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {customers.map((c, index) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 animate-fade-in cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleSelectCustomer(c)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{c.name}</p>
                      {c.totalVisits > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {c.totalVisits}회 방문
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {c.phone || '전화번호 없음'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(c);
                    }}
                    className="btn btn-ghost btn-sm btn-icon"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="btn btn-ghost btn-sm btn-icon text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
