import { useState, useEffect, useCallback, useRef } from 'react';
import { X, User, Phone, Calendar, Clock, Scissors, FileText, Loader2, UserPlus } from 'lucide-react';
import { reservationApi, designerApi, customerApi } from '../../lib/tauri';
import { CustomerSearch } from '../customer/CustomerSearch';
import type { Reservation, Designer, Customer } from '../../types';

interface CreateReservationInput {
  customerName?: string;
  customerPhone?: string;
  date: string;
  time: string;
  designerId?: string;
  serviceType?: string;
  notes?: string;
}

interface AppointmentFormProps {
  reservation?: Reservation;
  onSubmit: (reservation: Reservation) => void;
  onCancel: () => void;
}

const serviceTypes = [
  { value: '커트', label: '커트' },
  { value: '펌', label: '펌' },
  { value: '염색', label: '염색' },
  { value: '클리닉', label: '클리닉' },
  { value: '스타일링', label: '스타일링' },
];

export function AppointmentForm({ reservation, onSubmit, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState<CreateReservationInput>({
    customerName: reservation?.customerName || '',
    customerPhone: reservation?.customerPhone || '',
    date: reservation?.date || '',
    time: reservation?.time || '',
    designerId: reservation?.designerId || '',
    serviceType: reservation?.serviceType || '',
    notes: reservation?.notes || '',
  });
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(!reservation);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const phoneRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const designerRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    loadDesigners();
  }, []);

  // 신규 고객 모드에서 전화번호 입력 시 기존 고객 조회
  const checkExistingCustomer = useCallback(async (phone: string) => {
    if (!phone || phone.length < 4) {
      setExistingCustomer(null);
      return;
    }
    try {
      const found = await customerApi.getByPhone(phone);
      setExistingCustomer(found || null);
    } catch {
      setExistingCustomer(null);
    }
  }, []);

  useEffect(() => {
    if (!isNewCustomer || reservation) {
      setExistingCustomer(null);
      return;
    }
    const debounce = setTimeout(() => {
      checkExistingCustomer(formData.customerPhone || '');
    }, 500);
    return () => clearTimeout(debounce);
  }, [formData.customerPhone, isNewCustomer, reservation, checkExistingCustomer]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setExistingCustomer(null);
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone || '',
      designerId: customer.preferredDesignerId || formData.designerId,
      serviceType: customer.preferredService || formData.serviceType,
    });
    setIsNewCustomer(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setFormData({
      ...formData,
      customerName: '',
      customerPhone: '',
    });
  };

  const handleToggleNewCustomer = () => {
    setIsNewCustomer(!isNewCustomer);
    if (!isNewCustomer) {
      setSelectedCustomer(null);
      setExistingCustomer(null);
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerPhone?.trim()) newErrors.phone = '전화번호를 입력해주세요';
    if (!formData.date) newErrors.date = '날짜를 선택해주세요';
    if (!formData.time) newErrors.time = '시간을 선택해주세요';
    if (!formData.designerId) newErrors.designer = '디자이너를 선택해주세요';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.phone) phoneRef.current?.focus();
      else if (newErrors.date) dateRef.current?.focus();
      else if (newErrors.time) timeRef.current?.focus();
      else if (newErrors.designer) designerRef.current?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      // 신규 고객인 경우 고객 데이터도 등록 (기존 고객이 없을 때만)
      if (!reservation && isNewCustomer && formData.customerPhone && !existingCustomer) {
        try {
          await customerApi.create({
            name: formData.customerName || '',
            phone: formData.customerPhone,
            preferredDesignerId: formData.designerId,
            preferredService: formData.serviceType,
          });
        } catch {
          // 고객 등록 실패해도 예약은 계속 진행
          console.error('Failed to create customer, continuing with reservation');
        }
      }

      let result: Reservation;
      if (reservation) {
        result = await reservationApi.update(reservation.id, formData);
      } else {
        result = await reservationApi.create(formData);
      }
      onSubmit(result);
    } catch (error) {
      console.error('Failed to save reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="modal-header">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {reservation ? '예약 수정' : '새 예약'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Fields - Scrollable */}
      <div className="modal-body space-y-5">
        {/* Customer Info Section */}
        <div className="space-y-4">
          {!reservation && (
            <div className="flex items-center justify-between">
              <label className="label flex items-center gap-1.5 mb-0">
                <User className="w-3.5 h-3.5" />
                고객 정보
              </label>
              <button
                type="button"
                onClick={handleToggleNewCustomer}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                {isNewCustomer ? '기존 고객 검색' : '신규 고객 입력'}
              </button>
            </div>
          )}

          {!reservation && !isNewCustomer ? (
            <CustomerSearch
              selectedCustomer={selectedCustomer}
              onSelect={handleSelectCustomer}
              onClear={handleClearCustomer}
              placeholder="전화번호 또는 고객 이름으로 검색..."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                {reservation && (
                  <label className="label flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    연락처
                  </label>
                )}
                <input
                  ref={phoneRef}
                  type="tel"
                  value={formData.customerPhone || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, customerPhone: e.target.value });
                    if (errors.phone) setErrors((prev) => { const { phone: _, ...rest } = prev; return rest; });
                  }}
                  className={`input ${errors.phone ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                  placeholder="010-0000-0000"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              <div>
                {reservation && (
                  <label className="label flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    고객명
                  </label>
                )}
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="input"
                  placeholder="고객 이름을 입력하세요"
                />
              </div>
            </div>
          )}

          {selectedCustomer?.allergies && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                알레르기/주의사항
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">{selectedCustomer.allergies}</p>
            </div>
          )}
        </div>

        {/* Date & Time Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              날짜 <span className="text-red-500">*</span>
            </label>
            <input
              ref={dateRef}
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (errors.date) setErrors((prev) => { const { date: _, ...rest } = prev; return rest; });
              }}
              className={`input ${errors.date ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            />
            {errors.date && (
              <p className="mt-1 text-xs text-red-500">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              시간 <span className="text-red-500">*</span>
            </label>
            <input
              ref={timeRef}
              type="time"
              value={formData.time}
              onChange={(e) => {
                setFormData({ ...formData, time: e.target.value });
                if (errors.time) setErrors((prev) => { const { time: _, ...rest } = prev; return rest; });
              }}
              className={`input ${errors.time ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            />
            {errors.time && (
              <p className="mt-1 text-xs text-red-500">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Service Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              디자이너 <span className="text-red-500">*</span>
            </label>
            <select
              ref={designerRef}
              value={formData.designerId || ''}
              onChange={(e) => {
                setFormData({ ...formData, designerId: e.target.value });
                if (errors.designer) setErrors((prev) => { const { designer: _, ...rest } = prev; return rest; });
              }}
              className={`input select ${errors.designer ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            >
              <option value="">디자이너 선택</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.designer && (
              <p className="mt-1 text-xs text-red-500">{errors.designer}</p>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              서비스
            </label>
            <select
              value={formData.serviceType || ''}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="input select"
            >
              <option value="">서비스 선택</option>
              {serviceTypes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <label className="label flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            메모
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input min-h-[100px] resize-none"
            placeholder="특이사항이나 요청사항을 입력하세요"
            rows={3}
          />
        </div>
      </div>

      {/* Actions - Fixed Footer */}
      <div className="modal-footer flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
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
            '저장'
          )}
        </button>
      </div>
    </form>
  );
}
